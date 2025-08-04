import { Injectable, resource, signal } from '@angular/core';
import { streamFlow } from 'genkit/beta/client';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  readonly #command = signal<string | undefined>(undefined);
  message = resource({
    params: this.#command,
    stream: async () => {
      const data = signal<{ value: string } | { error: Error }>({
        value: '',
      });
      this.stream(this.#command() || '').then(async (res) => {
        for await (const chunk of res.stream) {
          data.update((prev) => {
            if ('value' in prev) {
              return { value: prev.value + chunk };
            } else {
              return { error: chunk };
            }
          });
        }
      });
      return data;
    },
  });

  setCommand(command: string) {
    this.#command.set(command);
  }
  async stream(command: string) {
    return streamFlow({
      url: this.getChatFlowUrl(),
      input: {
        command,
        sessionId: '123',
        clearSession: true,
      },
    });
  }

  getChatFlowUrl(): string {
    const isServer = typeof window === 'undefined';

    if (isServer) {
      const base = `http://localhost:${4000}`;
      return `${base}/chatFlow`;
    }

    return '/chatFlow';
  }
}
