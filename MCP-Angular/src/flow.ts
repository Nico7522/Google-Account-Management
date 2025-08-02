import { Chat, genkit, Session } from 'genkit/beta';
import {
  gemini15Flash,
  gemini15Pro,
  gemini20Flash,
  gemini20FlashLite,
  googleAI,
} from '@genkit-ai/googleai';
import { z } from 'zod';
const model = gemini15Flash;

const ai = genkit({
  plugins: [googleAI({ apiKey: 'API_KEY' })],
  model,
});
let session: Session;

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      userInput: z.string(),
      sessionId: z.string(),
      clearSession: z.boolean(),
    }),
    streamSchema: z.string(),
  },
  async (
    {
      userInput,
      sessionId,
      clearSession,
    }: {
      userInput: string;
      sessionId: string;
      clearSession: boolean;
    },
    { sendChunk }
  ) => {
    if (userInput.length === 0) {
      userInput = 'Hello, how are you?';
    }

    let chat: Chat;

    if (clearSession) {
      session = ai.createSession({
        sessionId,
      });
      await session.updateMessages(sessionId, []);
    }

    chat = session.chat({
      sessionId: sessionId,
      model: model,
      tools: [getMail],
    });
    const prompt = userInput;
    const { stream } = chat.sendStream({ prompt });
    for await (const chunk of stream) {
      for (const part of chunk.content) {
        if (part.text) {
          sendChunk(part.text);
        } else if (part.toolResponse?.output) {
          sendChunk(part.toolResponse.output as string);
        }
      }
    }
  }
);

const getMail = ai.defineTool(
  {
    name: 'getMail',
    description: 'Get the mail of the user',
    outputSchema: z.string(),
  },
  async (input) => {
    return 'sujet : "payement imoortant refusé, body: "un payement a été refusé, contacter le client au plus vite au numéro 06 06 06 06 06 pour en savoir plus."';
  }
);
const markdownRegex = /^\s*(```json)?((.|\n)*?)(```)?\s*$/i;
function maybeStripMarkdown(withMarkdown: string) {
  const mdMatch = markdownRegex.exec(withMarkdown);
  if (!mdMatch) {
    return withMarkdown;
  }
  return mdMatch[2];
}
