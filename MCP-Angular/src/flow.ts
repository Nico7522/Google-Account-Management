import { Chat, genkit, Session } from 'genkit/beta';
import { gemini20FlashLite, googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { environment } from './environments/environment';
import { Command } from './app/shared/interfaces/command';
import {
  openAICompatible,
  compatOaiModelRef,
  defineCompatOpenAIModel,

} from '@genkit-ai/compat-oai';
export const modelRef = compatOaiModelRef({
  name: 'qwen/qwen3-coder:free', // Should match `<pluginName>/<model-identifier>`
});
const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'qwen',
      apiKey:
        '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', 
      baseURL: 'https://openrouter.ai/api/v1', 
      initializer: async (ai, client) => {
        defineCompatOpenAIModel({
          ai,
          name: modelRef.name,
          client,
          modelRef,
        })
      }
    }),
  ],
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
    { sendChunk },
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
      model: modelRef,
      tools: [getMail, getLoginUrl],
    });
    let prompt = '';
    if (userInput === '1' || userInput === '2') {
      prompt = generatePrompt(userInput, token ?? '');
    } else {
      prompt = userInput;
    }
    const { stream } = chat.sendStream(prompt);

    for await (const chunk of stream) {
      for (const part of chunk.content) {
        if (part.text && part.text.trim() !== '') {
          sendChunk(part.text);
        }
      }
    }
  },
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
      }),
    ),
  },
  async ({ token }) => {
    const mails = await getMailFromAPI(token);
    return mails;
  },
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
  },
);

async function getMailFromAPI(token: string) {
  try {
    const res = await fetch(`${environment.API_URL}/mails`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response: { mailId: string; subject: string; body: string }[] =
      await res.json();
    return response;
  } catch (err) {
    return [
      {
        mailId: '',
        subject: 'Erreur lors de la récupération des mails',
        body: '',
      },
    ];
  }
}

async function login() {
  try {
    const res = await fetch(`${environment.API_URL}/auth/login`);

    const { url } = await res.json();
    return url as string;
  } catch (error) {
    return "Impossible de récupérer l'url de connexion";
  }
}

function generatePrompt(command: Command, token: string) {
  let prompt = 'Salut, comment ça va ?';
  switch (command) {
    case '1':
      prompt =
        "Utilise getLoginUrl pour récupérer l'url de connexion. Si tu ne parviens pas à récupérer l'url, répond 'Impossible de récupérer l'url'.";
      break;
    case '2':
      prompt = `Répond uniquement en markdown.
    Tu es un agent qui résume les emails de l'utilisateur.
    Tu dois répondre en français.

    Si tu ne parviens pas à récupérer les mails, répond "Impossible de récupérer les mails".

    Résume moi les 10 derniers mails. Utilise getMail pour récupérer les mails.
    voici le token : ${token}
    `;
      break;
  }

  return prompt;
}
