import { Chat, genkit, GenkitError, Session } from 'genkit/beta';
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
      userInput: z.string(),
      token: z.string().optional(),
      sessionId: z.string(),
      clearSession: z.boolean(),
    }),
  },
  async (
    {
      userInput,
      token,
      sessionId,
      clearSession,
    }: {
      userInput: string;
      token?: string;
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
    let prompt = '';
    if (userInput === '1' || userInput === '2') {
      prompt = generatePrompt(userInput, token ?? '');
    } else {
      prompt = userInput;
    }
    const { stream } = chat.sendStream({ prompt });

    for await (const chunk of stream) {
      for (const part of chunk.content) {
        if (part.text) {
          sendChunk(part.text);
        }
      }
    }
  }
);

const getMail = ai.defineTool(
  {
    name: 'getMail',
    description: 'Get the mail of the user',
    inputSchema: z.object({
      token: z.string(),
    }),
    outputSchema: z.array(
      z.object({
        mailId: z.string(),
        subject: z.string(),
        body: z.string(),
      })
    ),
  },
  async ({ token }) => {
    const mails = await getMailFromAPI(token);
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

async function getMailFromAPI(token: string) {
  try {
    const res = await fetch(`${environment.API_URL}/mails`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

function generatePrompt(command: Command, token: string) {
  let prompt = 'Salut, comment ça va ?';
  switch (command) {
    case '1':
      prompt = "Utilise getLoginUrl pour récupérer l'url de connexion.";
      break;
    case '2':
      prompt = `Répond uniquement en markdown.
    Tu es un agent qui résume les emails de l'utilisateur.
    Tu dois répondre en français.
    Résume moi les 10 derniers mails. Utilise getMail pour récupérer les mails.
    voici le token : ${token}
    `;
      break;
  }

  return prompt;
}
