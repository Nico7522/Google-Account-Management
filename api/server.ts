import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { oauth2Client, SCOPES } from "./config/google-config";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
  })
);
app.use(express.json());

app.get("/api/auth/login", async (req, res) => {
  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      include_granted_scopes: true,
    });
    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate login URL" });
  }
});

app.get("/api/auth/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    oauth2Client.setCredentials(tokens);

    return res.status(200).json({
      message: "Authentication successful",
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const { token } = req.body;
  if (!token) res.status(400).json({ error: "Token is required" });

  try {
    await oauth2Client.revokeToken(token);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
