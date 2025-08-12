import { Component, inject } from '@angular/core';
import { ChatService } from './chat-service';
import { commandToPromptAndMessage } from '../../helpers/command-to-prompt';
import { Command } from '../shared/models/command-type';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../shared/services/storage/storage-service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  readonly #chatService = inject(ChatService);
  readonly #storageService = inject(StorageService);
  isLoading = this.#chatService.response.isLoading;
  messages = this.#chatService.messages;
  error = this.#chatService.response.error;
  isLoggedIn = this.#storageService.isLoggedIn;
  userInput = '';
  handleCommand(command: Command) {
    const prompt = commandToPromptAndMessage(command, this.#storageService.userId());
    this.#chatService.setPrompt(prompt);
  }

  onSubmit() {
    this.#chatService.setPrompt({ prompt: this.userInput, message: this.userInput });
    this.userInput = '';
  }
}
