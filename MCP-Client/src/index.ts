import dotenv from "dotenv";

import { Request, Response } from "express";
import express from "express";
import cors from "cors";
import { processQuery } from "./openAI/open-ai";
import { McpClient } from "./config/client";
import { callGemini } from "./googleAI/gemini";
dotenv.config();

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

        const response = await callGemini(query, mcpClient.mcp);
        // const response = await processQuery(
        //   query,
        //   mcpClient.tools,
        //   mcpClient.mcp
        // );

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
