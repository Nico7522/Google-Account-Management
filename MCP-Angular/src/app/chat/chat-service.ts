import { HttpClient } from '@angular/common/http';
import { inject, Injectable, linkedSignal, resource, signal } from '@angular/core';
import { catchError, lastValueFrom, of } from 'rxjs';
import { ToastService } from '../shared/toast/toast-service';
import { marked } from 'marked';
import { Message } from '../shared/models/message-interface';
import { ChatContent } from '../shared/models/chat-content-interface';
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
      return this.#sendPrompt();
    },
  });

  /**
   * LinkedSignal containing the messages
   * Triggered by the response signal.
   */
  messages = linkedSignal<string | undefined, ChatContent[]>({
    source: () => this.response.value()?.response,
    computation: (source, previous): ChatContent[] => {

      if(source?.includes("Déconnecté avec succès")) {
        console.log(source);
        localStorage.removeItem('userId');
      }

      if (!source || source.trim() === '') {
        return previous?.value || [];
      }


      return previous ? [...previous.value, { role: 'model', parts: [{ text: marked.parse(source).toString() }] }] : [];
    },
  });

  /**
   * LinkedSignal containing the messages to send to the server. Without the markdown parsing.
   */
  #messagesToSend = linkedSignal<string | undefined, ChatContent[]>({
    source: () => this.response.value()?.response,
    computation: (source, previous): ChatContent[] => {
      console.log("la source", source);
      
      if(source?.includes("Déconnecté avec succès")) {
        console.log(source);
        localStorage.removeItem('userId');
      }

      if (!source || source.trim() === '') {
        return previous?.value || [];
      }
      

      return previous ? [...previous.value, { role: 'model', parts: [{ text: source }] }] : [];
    },
  });

  /**
   * Method for updating the linkedSignal with the user message.
   * @param userMessage The message to add to the linkedSignal.
   */
  addUserMessage(userMessage: string) {
    console.log(userMessage);
    this.messages.update(messages => [...messages, { role: 'user', parts: [{ text: marked.parse(userMessage).toString() }] }]);
  }

  /**
   * Method to set prompt signal
   * @param prompt
   */
  setPrompt(prompt: string): void {
    this.#prompt.set(undefined);
    this.#prompt.set(prompt);
    this.#messagesToSend.update(messages => [...messages, { role: 'user', parts: [{ text: prompt }] }]);

  }

  /**
   * Sends the prompt to the server and returns the response.
   * @param prompt The prompt to send.
   * @returns A promise that resolves to the server's response.
   */
  #sendPrompt(): Promise<{ response: string }> {
    return lastValueFrom(
      this.#httpClient.post<{ response: string }>('/api/chat', { query: this.#messagesToSend() }).pipe(
        catchError(() => {
          this.#toastService.showToast('error', 'Une erreur est survenue.');
          return of({ response: '' });
        })
      )
    );
  }
}
