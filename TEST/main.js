"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const API_KEY = "AIzaSyDb6PgI1BIM1bsnH472svZ98q0ybir7oqU";
const beta_1 = require("genkit/beta");
const googleai_1 = require("@genkit-ai/googleai");
const model = googleai_1.gemini20Flash;
let session;
const inputSchema = beta_1.z.object({
    userInput: beta_1.z.string(),
    sessionId: beta_1.z.string(),
    clearSession: beta_1.z.boolean(),
});
const outputSchema = beta_1.z.object({
    subject: beta_1.z.string(),
    bodyResume: beta_1.z.string(),
});
const ai = (0, beta_1.genkit)({
    plugins: [(0, googleai_1.googleAI)({ apiKey: API_KEY })],
    model,
});
const chatFlow = ai.defineFlow({
    name: "chatFlow",
    inputSchema,
    outputSchema,
}, (_a) => __awaiter(void 0, [_a], void 0, function* ({ userInput, sessionId, clearSession, }) {
    var _b, _c;
    if (userInput.length === 0) {
        userInput = "Hello, how are you?";
    }
    let chat;
    if (clearSession) {
        session = ai.createSession({
            sessionId,
        });
        yield session.updateMessages(sessionId, []);
    }
    chat = session.chat({ sessionId: sessionId, model: model });
    const prompt = `Tu est un expert en analyse de mail et tu sais parfaitement les résumer
    Tu dois répondre en JSON avec les champs suivants:
    - subject: le sujet du mail
    - bodyResume: le résumé du mail
    Voici le mail à analyser: ${userInput}
    `;
    const { text } = yield chat.send({ prompt });
    return {
        subject: (_b = text.match(/Sujet:\s*'([^']+)'/)) !== null && _b !== void 0 ? _b : "No subject found",
        bodyResume: (_c = text.match(/Body:\s*'([^']+)'/)) !== null && _c !== void 0 ? _c : "No body found",
    };
}));
chatFlow
    .run({
    userInput: "Sujet: 'Payement de votre abonnement Basic Fit', Body: 'Bonjour, nous avons reçu votre paiement de 100€ pour votre abonnement Basic Fit. Merci pour votre confiance.'",
    sessionId: "123",
    clearSession: true,
})
    .then((res) => {
    console.log(res);
});
