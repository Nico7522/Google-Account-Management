import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
dotenv.config();
const model = "qwen/qwen3-235b-a22b:free";
const llm = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.API_KEY,
});
export async function processQuery(query: string, tools: Tool[], mcp: Client) {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: query,
    },
  ];

  // Premier appel avec tools
  const completion = await llm.chat.completions.create({
    model,
    messages,
    tools: tools.map((tool) => ({
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

      // finalText.push(
      //   `[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`
      // );

      // Appel à ton serveur MCP (ou fonction locale)
      const result = await mcp.callTool({
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
      const finalResponse = await llm.chat.completions.create({
        model,
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
  console.log(finalText);

  return finalText.join("\n");
}
