import { ChatContent } from './chat-content';

/**
 * Interface for the chat.
 * @param AImessage - The messages array exchanged with the server.
 * @param chatMessage - The messages array displayed to the user.
 */
export interface Chat {
  AImessage: ChatContent[];
  chatMessage: ChatContent[];
}
