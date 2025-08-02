const API_KEY = "AIzaSyDb6PgI1BIM1bsnH472svZ98q0ybir7oqU";

import { Chat, genkit, Session, z } from "genkit/beta";
import { gemini20Flash, googleAI } from "@genkit-ai/googleai";

import { createInterface } from "node:readline/promises";

const ai = genkit({
  plugins: [googleAI()],
  model: gemini20Flash,
});

async function main() {
  const chat = ai.chat();
  console.log("You're chatting with Gemini. Ctrl-C to quit.\n");
  const readline = createInterface(process.stdin, process.stdout);
  while (true) {
    const userInput = await readline.question("> ");
    const { text } = await chat.send(userInput);
    console.log(text);
  }
}

main();
