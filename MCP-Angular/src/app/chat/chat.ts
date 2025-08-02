import { Component, computed, inject } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { ChatService } from './chat-service';
@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #sanatizer = inject(DomSanitizer);
  readonly #chatService = inject(ChatService);
  message = this.#chatService.message;
  parsedMessage = computed(() =>
    this.#sanatizer.bypassSecurityTrustHtml(
      marked.parse(this.message.value() || '').toString()
    )
  );

  handleCommand(command: string) {
    this.#chatService.setCommand(command);
  }
}
