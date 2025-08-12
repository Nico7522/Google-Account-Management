export interface ChatContent {
  role: "user" | "model";
  parts: {
    text: string;
  }[];
}