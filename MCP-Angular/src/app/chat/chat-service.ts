import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, linkedSignal, resource, signal } from '@angular/core';
import { catchError, lastValueFrom, of } from 'rxjs';
import { ToastService } from '../shared/toast/toast-service';
import { marked } from 'marked';
import { Message } from '../shared/models/message-interface';
import { Chat } from '../shared/models/chat-interface';
import { Command } from '../shared/models/command-type';
import { PromptAndMessage } from '../shared/models/prompt-and-message-interface';
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  readonly #httpClient = inject(HttpClient);
  readonly #toastService = inject(ToastService);
  /**
   * Signal triggering the response resource.
   */
  #prompt = signal<string | undefined>(undefined);

  /**
   * Resource receiving the response from the server.
   */
  response = resource({
    params: this.#prompt,
    loader: (): Promise<{ response: string }> => {
      return this.#sendPrompt();
    },
  });

  /**
   * LinkedSignal containing the messages. Used to store the messages exchanged with the server and the messages to display to the user.
   * Triggered by the response signal.
   */
  messages = linkedSignal<string | undefined, Chat>({
    source: () => this.response.value()?.response,
    computation: (source, previous): Chat => {
      if (source?.includes('Déconnecté avec succès')) {
        localStorage.removeItem('userId');
      }

      if (!source || source.trim() === '') {
        return previous?.value || { AImessage: [], chatMessage: [] };
      }

      return previous
        ? {
            AImessage: [...previous.value.AImessage, { role: 'model', parts: [{ text: source }] }],
            chatMessage: [...previous.value.chatMessage, { role: 'model', parts: [{ text: marked.parse(source).toString() }] }],
          }
        : { AImessage: [], chatMessage: [] };
    },
  });

  /**
   * Method for updating the linkedSignal containing the messages. Used to add the user message to the linkedSignal.
   * @param prompt - The prompt to add to the linkedSignal.
   */
  addUserMessage(prompt: PromptAndMessage) {
    this.messages.update(messages => ({
      AImessage: [...messages.AImessage, { role: 'user', parts: [{ text: prompt.prompt }] }],
      chatMessage: [...messages.chatMessage, { role: 'user', parts: [{ text: marked.parse(prompt.message).toString() }] }],
    }));
  }

  /**
   * Method to set the prompt signal.
   * @param prompt - The prompt to set.
   */
  setPrompt(prompt: PromptAndMessage): void {
    this.#prompt.set(undefined);
    this.#prompt.set(prompt.prompt);
    this.addUserMessage(prompt);
  }

  /**
   * Sends the messages to the server.
   * @returns A promise that resolves to the server's response.
   */
  #sendPrompt(): Promise<{ response: string }> {
    return lastValueFrom(
      this.#httpClient.post<{ response: string }>('/api/chat', { query: this.messages().AImessage }).pipe(
        catchError(() => {
          this.#toastService.showToast('error', 'Une erreur est survenue.');
          return of({ response: '' });
        })
      )
    );
  }
}
