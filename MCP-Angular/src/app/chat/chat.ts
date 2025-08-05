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
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Command } from '../shared/interfaces/command';

@Component({
  selector: 'app-chat',
  imports: [DatePipe, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #sanatizer = inject(DomSanitizer);
  readonly #chatService = inject(ChatService);
  readonly #userService = inject(UserService);
  tokens = this.#userService.tokens;
  message = this.#chatService.message;
  chat = this.#chatService.chat;
  userInput = '';

  handleCommand(command: Command) {
    this.#chatService.updateChatFromUserInput(command);
  }

  onSubmit() {
    this.#chatService.updateChatFromUserInput(this.userInput);
    this.userInput = '';
  }

  logout() {
    this.#userService.logout();
  }
  constructor() {}
}
