import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { oauth2Client, SCOPES } from "../config/google-config";
import http from "node:http";
import { google } from "googleapis";
import { cleanEmailContent } from "./helpers/html-helper";
import z from "zod";
import { getFakeDb, removeFakeDb, setFakeDb } from "../db/db";
const server = new McpServer({
  name: "mcp-test",
  version: "1.0.0",
  description: "MCP Server for Google API integration",
});

server.tool(
  "getAuthUrl",
  {
    title: "Get Auth URL",
    description: "Get the authentication URL to connect to Google APIs",
  },
  async () => {
    try {
      // await startHttpServer();
      const { url } = await getAuthUrl();

      return {
        content: [
          {
            type: "text",
            text: url,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `💥 Exception inattendue: ${
              err instanceof Error ? err.message : String(err)
            }`,
          },
        ],
      };
    }
  }
);

server.tool(
  "getTokens",
  "Get tokens for acces to mails and calendar",
  {
    code: z.string(),
  },
  async ({ code }) => {
    try {
      const userId = await getTokens(code);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(userId),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }
);

server.tool(
  "logout",
  "logout the user by revoking the tokens",
  {
    userId: z.string(),
  },
  async ({ userId }) => {
    try {
      await logout(userId);
      return {
        content: [
          {
            type: "text",
            text: "Succefully disconnected",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: String(error),
          },
        ],
      };
    }
  }
);

server.tool("getMyCalendar", async () => {
  const isAuthenticated = await setAccessToken();
  if (!isAuthenticated) {
    return {
      content: [
        {
          type: "text",
          text: "Vous n'êtes pas authentifié",
        },
      ],
    };
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(await getMyCalendar(new Date().toISOString())),
      },
    ],
  };
});

server.tool(
  "getMyMails",
  "Get My Mails",
  {
    userId: z.string(),
  },
  async ({ userId }) => {
    const isAuthenticated = await setAccessToken(userId);
    if (!isAuthenticated) {
      return {
        content: [
          {
            type: "text",
            text: "Vous n'êtes pas authentifié",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getMyGmail()),
        },
      ],
    };
  }
);

/**
 * Get the authentication URL
 * @returns The authentication URL
 */
async function getAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    include_granted_scopes: true,
  });
  return {
    url: authUrl,
  };
}

/**
 * Get the tokens from the code, write them into the fake db and return the user id
 * @param code The code to exchange for tokens
 * @returns The user id
 */
async function getTokens(code: string): Promise<string> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });
    const userInfo = await oauth2.userinfo.get();
    if (!userInfo.data.id) throw new Error("User ID not found");
    setFakeDb(userInfo.data.id, {
      accessToken: tokens.access_token ?? "",
      refreshToken: tokens.refresh_token ?? "",
    });

    return userInfo.data.id;
  } catch (error) {
    throw error;
  }
}
/**
 * Logout the user by revoking the tokens
 * @param userID - The user id
 */
async function logout(userID: string) {
  try {
    const tokens = getFakeDb()[userID];

    if (tokens && tokens.accessToken) {
      try {
        oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        const oauth2 = google.oauth2({
          version: "v2",
          auth: oauth2Client,
        });
        await oauth2.userinfo.get();

        await oauth2Client.revokeToken(tokens.accessToken);
      } catch (tokenError) {}
    }

    removeFakeDb(userID);
  } catch (error) {
    throw error;
  }
}

/**
 * Get the access token from the fake_db.json file and set it to the oauth2Client
 * @param userId - Optional user ID. If not provided, uses the first available user's tokens
 * @returns True if the access token is set, false otherwise
 */
async function setAccessToken(userId?: string) {
  try {
    const fakeDb = getFakeDb();

    const targetUserId = userId || Object.keys(fakeDb)[0];

    if (!targetUserId || !fakeDb[targetUserId]) {
      return false;
    }

    const tokens = fakeDb[targetUserId];

    if (!tokens.accessToken) {
      return false;
    }

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the events from the calendar
 * @param date - The date to get the events from
 * @returns The events from the calendar
 */
async function getMyCalendar(date: string) {
  try {
    // Take today date and set the time to 00:00:00
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    // Take today date and add 1 day
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      eventTypes: ["birthday", "fromGmail", "default"],
    });
    const events = res.data.items || [];
    const meetings = events.map((event) => {
      if (event.start) {
        const start = event.start.dateTime || event.start.date;
        return `${event.summary} at ${start}`;
      }
      return "Aucun événement trouvé";
    });
    if (meetings.length > 0) {
      return {
        meetings,
      };
    } else {
      return {
        meetings: [],
      };
    }
  } catch (error) {
    return (error as Error).message;
  }
}

/**
 * Get the last 10 emails
 * @returns The last 10 emails
 */
async function getMyGmail() {
  try {
    // Get the last 10 emails
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });
    const messages = res.data.messages || [];

    // Get the email details
    const emails = await Promise.all(
      messages.map(async (message) => {
        const email = await getMailById(message.id ?? "");
        return email;
      })
    );

    // Return the email details
    return emails.map((email) => {
      return {
        id: email.data.id ?? "",
        threadId: email.data.threadId ?? "",
        snippet: email.data.snippet ?? "",
        from:
          email.data.payload?.headers?.find((h) => h.name === "From")?.value ??
          "",
        to:
          email.data.payload?.headers?.find((h) => h.name === "To")?.value ??
          "",
        subject:
          email.data.payload?.headers?.find((h) => h.name === "Subject")
            ?.value ?? "",
        date:
          email.data.payload?.headers?.find((h) => h.name === "Date")?.value ??
          "",
        body: cleanEmailContent(email.data) || "",
      };
    });
  } catch (error) {
    return (error as Error).message;
  }
}

/**
 * Get the email details by id
 * @param id - The id of the email
 * @returns The email details
 */
async function getMailById(id: string) {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
  });
  return res;
}

/**
 * Start the HTTP server for handling the access token
 */
let httpServer: http.Server;
async function startHttpServer() {
  httpServer = http.createServer(async (req, res) => {
    if (req.url!.includes("/oauth2callback")) {
      const callbackUrl = new URL(req.url!, `http://localhost:3200`);
      const code = callbackUrl.searchParams.get("code");
      try {
        const { tokens } = await oauth2Client.getToken(code ?? "");
        oauth2Client.setCredentials(tokens);

        await fs.promises.writeFile(
          path.resolve(__dirname, "../../token.json"),
          JSON.stringify(tokens),
          "utf-8"
        );
        res.end("✅ Authentification réussie. Vous pouvez fermer cette page.");

        httpServer.close();
      } catch (error) {
        res.end(
          `❌ Échec: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  });

  httpServer.listen(3200);
}

/**
 * Initialize the server
 */
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

init();
