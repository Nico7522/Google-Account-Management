import { Component, inject } from '@angular/core';
import { ChatService } from './chat-service';
import { UserService } from '../shared/user/user-service';

import { FormsModule } from '@angular/forms';
import { Command } from '../shared/interfaces/command';
import { catchError, EMPTY, take } from 'rxjs';
import { ErrorService } from '../shared/error/error-service/error-service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #errorService = inject(ErrorService);
  readonly #chatService = inject(ChatService);
  readonly #userService = inject(UserService);
  error = this.#errorService.error;
  tokens = this.#userService.tokens;
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
    this.#userService
      .logout()
      .pipe(
        take(1),
        catchError(() => {
          this.#errorService.showError('Erreur lors de la déconnexion');
          return EMPTY;
        })
      )
      .subscribe();
  }
}
