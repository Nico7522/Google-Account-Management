import { Chat, genkit, Session } from 'genkit/beta';
import {
  gemini15Flash,
  gemini20FlashLite,
  gemini25FlashLite,
  googleAI,
} from '@genkit-ai/googleai';
import { z } from 'zod';
import { environment } from './environments/environment';

type Command = '1' | '2';

const model = gemini25FlashLite;

const ai = genkit({
  plugins: [googleAI({ apiKey: environment.API_KEY })],
  model,
});
let session: Session;

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      command: z.enum(['1', '2']),
      sessionId: z.string(),
      clearSession: z.boolean(),
    }),
  },
  async (
    {
      command,
      sessionId,
      clearSession,
    }: {
      command: Command;
      sessionId: string;
      clearSession: boolean;
    },
    { sendChunk }
  ) => {
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
      tools: [getMail, getLoginUrl],
    });
    const prompt = generatePrompt(command);

    const { stream } = chat.sendStream({ prompt });
    for await (const chunk of stream) {
      for (const part of chunk.content) {
        if (part.text) {
          sendChunk(part.text);
        }
        // else if (part.toolResponse?.output) {
        //   sendChunk(part.toolResponse.output as string);
        // }
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

const getLoginUrl = ai.defineTool(
  {
    name: 'getLoginUrl',
    description: 'Get the login URL for the user',
    outputSchema: z.string(),
  },
  async () => {
    const url = await login();
    return url;
  }
);

async function getMailFromAPI() {
  try {
    const res = await fetch(`${environment.API_URL}/mails`);

    if (!res.ok) {
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
    return response;
  } catch (err) {
    return [
      {
        mailId: 'error',
        subject: 'Erreur lors de la récupération des mails',
        body: `Exception: ${err}`,
      },
    ];
  }
}

async function login() {
  try {
    const res = await fetch(`${environment.API_URL}/auth/login`);
    if (!res.ok) {
      console.log(res);

      throw new Error(`Erreur lors de la connexion: ${res.status}`);
    }
    const { url } = await res.json();
    return url as string;
  } catch (error) {
    throw new Error(
      `Erreur lors de la connexion: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

function generatePrompt(command: Command) {
  let prompt = 'Salut, comment ça va ?';
  switch (command) {
    case '1':
      prompt = "Utilise getLoginUrl pour récupérer l'url de connexion.";
      break;
    case '2':
      prompt = `Répond uniquement en markdown.
    Tu es un agent qui résume les emails de l'utilisateur.
    Tu dois répondre en français.
    Donne mes mails stp. Utilise getMail pour récupérer les mails.`;
      break;
  }

  return prompt;
}
