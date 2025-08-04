import {
  afterEveryRender,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { ChatService } from './chat-service';
import { UserService } from '../shared/user/user-service';
import { afterNextRender, AfterRenderRef } from '@angular/core';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #sanatizer = inject(DomSanitizer);
  readonly #chatService = inject(ChatService);
  readonly #userService = inject(UserService);
  tokens = this.#userService.tokens;
  message = this.#chatService.message;
  parsedMessage = computed(() =>
    marked.parse(this.message.value() || '').toString()
  );

  handleCommand(command: string) {
    this.#chatService.setCommand(command);
  }
  constructor() {}
}
