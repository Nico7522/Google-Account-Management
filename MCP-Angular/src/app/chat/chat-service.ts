import {
  inject,
  Injectable,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { streamFlow } from 'genkit/beta/client';
import { Chat, Role } from '../shared/interfaces/chat-interface';
import { marked } from 'marked';
import { ErrorService } from '../shared/error/error-service/error-service';
import { UserService } from '../shared/user/user-service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  readonly #errorService = inject(ErrorService);
  readonly #userService = inject(UserService);
  userInput = signal<string | undefined>(undefined);
  message = resource({
    params: this.userInput,
    stream: async () => {
      const data = signal<
        { value: { id: number; text: string } } | { error: Error }
      >({
        value: { id: 0, text: '' },
      });

      this.stream(this.userInput() || '')
        .then(async (res) => {
          const id = Math.floor(Math.random() * 2000);

          for await (const chunk of res.stream) {
            data.update((prev) => {
              if ('value' in prev) {
                return { value: { id: id, text: prev.value.text + chunk } };
              } else {
                return { error: chunk };
              }
            });
          }
        })
        .catch(() => {
          this.#errorService.showError('Une erreur est survenue');
        });

      return data;
    },
  });

  sessionId = linkedSignal<string, string>({
    source: () => this.message.value()?.text || '',
    computation: (_source, previous): string =>
      !previous
        ? Date.now() + '' + Math.floor(Math.random() * 1000000000)
        : previous.value,
  });

  clearSession = linkedSignal({
    source: () => this.message.value() || '',
    computation: (_source, previous): boolean => !previous,
  });

  chat = linkedSignal<{ id: number; text: string }, Chat[]>({
    source: () => this.message.value() || { id: 0, text: '' },
    computation: (source, previous): Chat[] => {
      if (source.id === 0) {
        return previous?.value || [];
      }
      let message = previous?.value.find((item) => item.id === source.id);
      let filtered = previous?.value.filter((item) => item.id !== source.id);
      if (message && filtered) {
        return [
          ...filtered,
          { ...message, text: marked.parse(source.text).toString() },
        ];
      }

      const chatItem = this.chatItem(source.text, 'AGENT', source.id);
      return previous ? [...previous.value, chatItem] : [chatItem];
    },
  });

  #getChatFlowUrl(): string {
    const isServer = typeof window === 'undefined';

    if (isServer) {
      const base = `http://localhost:${4000}`;
      return `${base}/chatFlow`;
    }

    return '/chatFlow';
  }

  updateChatFromUserInput(input: string) {
    let text = input;
    if (input === '1') {
      text = 'Je voudrais me connecter à mon compte Gmail';
    }
    if (input === '2') {
      text = 'Je voudrais voir mes 10 derniers mails';
    }
    const chatItem = this.chatItem(text, 'USER');
    this.chat.update((prev) => [...prev, chatItem]);
    this.userInput.set(input);
  }

  chatItem(text: string, role: Role, id?: number): Chat {
    return {
      id: id || Math.floor(Math.random() * 2000),
      text: marked.parse(text).toString(),
      role,
    };
  }
  async stream(userInput: string) {
    const res = streamFlow({
      url: this.#getChatFlowUrl(),
      input: {
        userInput,
        sessionId: this.sessionId(),
        clearSession: this.clearSession(),
        token: this.#userService.tokens()?.accessToken,
      },
    });

    return res;
  }
}
