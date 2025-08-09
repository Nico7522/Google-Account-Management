import { Component, inject } from '@angular/core';
import { ChatService } from './chat-service';
import { commandToPrompt } from '../../helpers/command-to-prompt';
import { Command } from '../shared/models/command-type';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../shared/auth/auth-service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #chatService = inject(ChatService);
  readonly #authService = inject(AuthService)
  isLoading = this.#chatService.response.isLoading;
  messages = this.#chatService.messages;
  error = this.#chatService.response.error;
  userInput = '';
  handleCommand(command: Command) {
    const prompt = commandToPrompt(command);
    this.#chatService.addUserMessage(prompt);
    this.#chatService.setPrompt(prompt);
  }

  onSubmit() {
    this.#chatService.setPrompt(this.userInput);
    this.#chatService.addUserMessage(this.userInput);
    this.userInput = '';
  }

  logout() {
    this.#authService.logout().subscribe(res => console.log('res')
    )
  }
}
