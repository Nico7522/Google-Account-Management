import { Injectable, signal } from '@angular/core';
import { Tokens } from '../interfaces/tokens-interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  #tokens = signal<Tokens | undefined>(this.#getTokenFormLocalStorage());
  tokens = this.#tokens.asReadonly();

  #getTokenFormLocalStorage() {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return accessToken && refreshToken
      ? { accessToken, refreshToken }
      : undefined;
  }

  setTokens(tokens: Tokens) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.#tokens.set(tokens);
  }
}
