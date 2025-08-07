import { HttpClient } from '@angular/common/http';
import { inject, Injectable, linkedSignal, resource, signal } from '@angular/core';
import { catchError, EMPTY, lastValueFrom } from 'rxjs';
import { ToastService } from '../shared/toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  readonly #httpClient = inject(HttpClient);
  readonly #toastService = inject(ToastService);
  /**
   * Signal triggering the resource
   */
  #prompt = signal<string | undefined>(undefined);

  /**
   * Resource receiving the response
   */
  response = resource({
    params: this.#prompt,
    loader: ({ params }): Promise<{ response: string }> => {
      return this.#sendPrompt(params);
    },
  });

  /**
   * LinkedSignal containing the messages
   * Triggered by the response signal.
   */
  messages = linkedSignal<string | undefined, string[]>({
    source: () => this.response.value()?.response,
    computation: (source, previous): string[] => {
      if (previous) {
        return [...(previous.value || []), source || ''];
      }
      return [source || ''];
    },
  });

  /**
   * Method for updating the linkedSignal with the user message.
   * @param userMessage The message to add to the linkedSignal.
   */
  addUserMessage(userMessage: string) {
    this.messages.update(messages => [...messages, userMessage]);
  }

  /**
   * Method to set prompt signal
   * @param prompt
   */
  setPrompt(prompt: string): void {
    this.#prompt.set(prompt);
  }

  /**
   * Sends the prompt to the server and returns the response.
   * @param prompt The prompt to send.
   * @returns A promise that resolves to the server's response.
   */
  #sendPrompt(prompt: string): Promise<{ response: string }> {
    return lastValueFrom(
      this.#httpClient.post<{ response: string }>('/api/chat', { query: prompt }).pipe(
        catchError(() => {
          this.#toastService.showToast('error', 'Une erreur est survenue.');
          return EMPTY;
        })
      )
    );
  }
}
