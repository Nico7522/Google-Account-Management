import { gmail_v1 } from "googleapis";

export function extractHtmlFromMessage(
  message: gmail_v1.Schema$Message
): string | null {
  function findHtmlPart(
    payload: gmail_v1.Schema$MessagePart
  ): gmail_v1.Schema$MessagePart | null {
    if (payload.mimeType === "text/html") {
      return payload;
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const found = findHtmlPart(part);
        if (found) return found;
      }
    }

    return null;
  }

  let htmlPart;
  if (message.payload) htmlPart = findHtmlPart(message.payload);
  else htmlPart = null;

  if (htmlPart && htmlPart?.body?.data) {
    // Décoder le contenu base64
    return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
  }

  return null;
}
export const cleanEmailContent = (messageData: any): string => {
  const cheerio = require("cheerio");
  try {
    // Essayer d'extraire le contenu HTML d'abord
    const htmlContent = extractHtmlFromMessage(messageData);

    if (htmlContent) {
      // Utiliser cheerio pour extraire le texte des balises HTML
      const $ = cheerio.load(htmlContent);

      // Supprimer les scripts, styles, et autres éléments non pertinents
      $("script, style, meta, link, head").remove();

      // Extraire le texte et nettoyer
      let textContent = $("body").text() || $.text();

      // Nettoyer les espaces multiples et les retours à la ligne
      textContent = textContent
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      // Limiter la taille (garder seulement les 1000 premiers caractères)
      return textContent;
    }

    // Fallback: essayer d'extraire depuis le format plain text
    const payload = messageData.payload;
    if (payload) {
      // Chercher la partie text/plain
      if (payload.mimeType === "text/plain" && payload.body?.data) {
        const textContent = Buffer.from(payload.body.data, "base64").toString(
          "utf-8"
        );
        return textContent;
      }

      // Chercher dans les parties multipart
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            const textContent = Buffer.from(part.body.data, "base64").toString(
              "utf-8"
            );
            return textContent;
          }
        }
      }
    }

    return "Contenu non disponible";
  } catch (error) {
    console.error("Erreur lors du nettoyage du contenu:", error);
    return "Erreur lors de l'extraction du contenu";
  }
};
