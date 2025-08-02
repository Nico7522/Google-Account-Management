import { Chat, genkit, Session } from 'genkit/beta';
import {
  gemini15Flash,
  gemini15Pro,
  gemini20Flash,
  gemini20FlashLite,
  googleAI,
} from '@genkit-ai/googleai';
import { z } from 'zod';
import { log } from 'node:console';
import { environment } from './environments/environment';
const model = gemini15Flash;

const ai = genkit({
  plugins: [googleAI({ apiKey: environment.API_KEY })],
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
    const prompt = `Tu es un agent qui résume les emails de l'utilisateur.
    TU NE DOIS Réponde qu'en MARKDOWN.
    Tu dois répondre en français.
    `;
    const { stream } = chat.sendStream({ prompt: prompt });
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
    outputSchema: z.array(
      z.object({
        mailId: z.string(),
        subject: z.string(),
        body: z.string(),
      })
    ),
  },
  async () => {
    const mails = await getMailFromAPI();
    return mails;
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

async function getMailFromAPI() {
  console.log("[getMail] Appel de l'API pour récupérer les mails...");
  try {
    const res = await fetch(
      'http://localhost:3000/api/gmail/users/user_1753630455830/messages/full'
    );
    if (!res.ok) {
      console.error(`[getMail] Erreur API: ${res.status} ${res.statusText}`);
      return [
        {
          mailId: 'error',
          subject: 'Erreur lors de la récupération des mails',
          body: `Impossible de récupérer les mails (code: ${res.status})`,
        },
      ];
    }
    const response: { mailId: string; subject: string; body: string }[] =
      await res.json();
    console.log(`[getMail] ${response.length} mails récupérés.`);
    return response;
  } catch (err) {
    console.error("[getMail] Exception lors de l'appel API:", err);
    return [
      {
        mailId: 'error',
        subject: 'Erreur lors de la récupération des mails',
        body: `Exception: ${err}`,
      },
    ];
  }
}
