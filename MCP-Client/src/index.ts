import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import readline from "readline/promises";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Request, Response } from "express";
import express from "express";
import cors from "cors";
dotenv.config();

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API KEY is not set");
}

class McpClient {
  private mcp: Client;
  private llm: OpenAI;
  private transport: StdioClientTransport | null = null;
  #tools: Tool[] = [];

  constructor() {
    this.llm = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: API_KEY,
    });

    this.mcp = new Client({
      name: "mcp-client",
      version: "1.0.0",
    });
  }

  /**
   * Connect to MCP server
   * @param serverScriptPath - The path to the MCP server
   */
  async connect(serverScriptPath: string) {
    this.transport = new StdioClientTransport({
      command: "node",
      args: [serverScriptPath],
    });
    await this.mcp.connect(this.transport);
    await this.#registerTools();

    console.log(
      "Connected to MCP server",
      this.#tools.map(({ name }) => name)
    );
  }

  /**
   * Assign available tools to tools array
   */
  async #registerTools() {
    const toolsResult = await this.mcp.listTools();

    this.#tools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  get tools() {
    return this.#tools;
  }

  /**
   * Process query
   * @param query - The query to process
   * @returns The response from the LLM
   */
  async processQuery(query: string) {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    // Premier appel avec tools
    const completion = await this.llm.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages,
      tools: this.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      })),
    });

    const msg = completion.choices[0].message;
    const finalText: string[] = [];

    if (msg.content) {
      finalText.push(msg.content);
      //yield msg.content;
    }

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const toolCall of msg.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

        finalText.push(
          `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
        );

        // Appel à ton serveur MCP (ou fonction locale)
        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        });

        // Ajoute la réponse du tool dans le chat
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result.content as string, // Already string,
        });

        // Relance le modèle avec la réponse du tool
        const finalResponse = await this.llm.chat.completions.create({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages,
        });
        // for await (const chunk of finalResponse) {
        //   if (chunk.choices[0].delta.content) {
        //     console.log("Streaming chunk:", chunk.choices[0].delta.content);

        //     yield chunk.choices[0].delta.content;
        //   }
        // }
        const finalMsg = finalResponse.choices[0].message;
        if (finalMsg.content) {
          finalText.push(finalMsg.content);
        }
      }
    }

    return finalText.join("\n");
  }

  /**
   * Start the chat
   */
  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("MCP Client started");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("Enter your query: ");
        if (message.toLowerCase() === "quit") {
          break;
        }

        const response = await this.processQuery(message);
        console.log("\n", response);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      rl.close();
    }
  }

  /**
   * Close the MCP client
   */
  async cleanup() {
    await this.mcp.close();
  }
}

/**
 * Main function, run the MCP client
 */
async function main() {
  if (process.argv.length < 3) {
    console.error("Usage: node index.js <server-script-path>");
    return;
  }

  const app = express();
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  const mcpClient = new McpClient();

  try {
    await mcpClient.connect(process.argv[2]);

    const healthCheck = (req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        tools: mcpClient.tools.map((tool) => tool.name),
      });
    };

    app.get("/health", healthCheck);

    const chatHandler = async (req: Request, res: Response) => {
      try {
        const { query } = req.body;

        if (!query) {
          return res.status(400).json({ error: "Query is required" });
        }

        const response = await mcpClient.processQuery(query);

        res.status(200).json({ response });
        // res.setHeader("Content-Type", "text/plain; charset=utf-8");
        // res.setHeader("Transfer-Encoding", "chunked");

        // for await (const chunk of mcpClient.processQuery(query)) {
        //   console.log("Sending chunk:", chunk);

        //   res.write(chunk);
        // }

        // res.end();
      } catch (error) {
        console.error("Error processing query:", error);
        res.status(500).json({ error: "Failed to process query" });
      }
    };
    app.post("/chat", chatHandler);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      await mcpClient.cleanup();
      process.exit(0);
    });

    // Keep the process alive
    process.on("SIGINT", async () => {
      console.log("SIGINT received. Shutting down gracefully...");
      await mcpClient.cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error:", error);
    await mcpClient.cleanup();
    process.exit(1);
  }
}

main();
