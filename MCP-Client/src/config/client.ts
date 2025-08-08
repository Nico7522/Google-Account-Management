import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { processQuery } from "../openAI/open-ai";
import readline from "readline/promises";
export class McpClient {
  mcp: Client;
  private transport: StdioClientTransport | null = null;
  #tools: Tool[] = [];
  constructor() {
    this.mcp = new Client({
      name: "mcp-client",
      version: "1.0.0",
    });
  }
  get tools() {
    return this.#tools;
  }
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

  async #registerTools() {
    const toolsResult = await this.mcp.listTools();

    this.#tools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

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

        const response = await processQuery(message, this.tools, this.mcp);
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
