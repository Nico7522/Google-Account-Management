import * as cheerio from "cheerio";
import { gmail_v1 } from "googleapis";

/**
 * Extract the HTML content from a message
 * @param message - The message to extract the HTML content from
 * @returns The HTML content of the message
 */
export function extractHtmlFromMessage(
  message: gmail_v1.Schema$Message
): string | null {
  /**
   * Find the HTML part in a message
   * @param payload - The payload to find the HTML part in
   * @returns The HTML part of the message or null if not found
   */
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
    return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
  }

  return null;
}

/**
 * Clean the email content by extracting the HTML content and then using cheerio to extract the text
 * @param messageData - The message data to clean
 * @returns The cleaned email content or an error message
 */
export function cleanEmailContent(messageData: any) {
  try {
    const htmlContent = extractHtmlFromMessage(messageData);

    if (htmlContent) {
      const $ = cheerio.load(htmlContent);

      $("script, style, meta, link, head").remove();

      let textContent = $("body").text() || $.text();

      textContent = textContent
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim();

      return textContent;
    }

    const payload = messageData.payload;
    if (payload) {
      if (payload.mimeType === "text/plain" && payload.body?.data) {
        const textContent = Buffer.from(payload.body.data, "base64").toString(
          "utf-8"
        );
        return textContent;
      }

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
    return "Erreur lors de l'extraction du contenu";
  }
}
