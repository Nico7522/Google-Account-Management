import { Component, resource, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [RouterOutlet, FormsModule],
})
export class App {
  protected title = 'MCP-Angular';
  url = '/chatFlow';

  characters = resource({
    stream: async () => {
      const data = signal<{ value: string } | { error: Error }>({
        value: '',
      });
      this.stream().then(async (res) => {
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

  async stream() {
    return streamFlow({
      url: this.getChatFlowUrl(),
      input: {
        userInput: 'donne moi mes mails stp je veux la réponde en markdown',
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
  /*   response = resource({
    loader: () => {
      return runFlow({
        url: this.url,
        input: {
          userInput: 'Hello',
          sessionId: '123',
          clearSession: true,
        },
      });
    },
  }); */
}
