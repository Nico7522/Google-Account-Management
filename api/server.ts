import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { oauth2Client, SCOPES } from "./config/google-config";
dotenv.config();
const app = express();

app.use(cors());
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

app.get("/api/auth/login/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    res.status(200).json({ message: "Authentication successful", tokens });
  } catch (error) {
    console.log("Authentication error:", error);

    res.status(500).json({ error: "Authentication failed" });
  }
});

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
