/**
 * Interface for the chat content.
 * @param role - The role of the chat content.
 * @param parts - The parts of the chat content.
 */
export interface ChatContent {
  role: 'user' | 'model';
  parts: {
    text: string;
  }[];
}
