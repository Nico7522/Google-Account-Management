import { GoogleGenAI, mcpToTool } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});
const model = "gemini-2.0-flash-exp";

export async function callGemini(prompt: string, client: Client) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [mcpToTool(client)],
    },
  });

  return response?.text;
}
