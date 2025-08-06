import { inject, Injectable, signal } from '@angular/core';
import { Tokens } from '../interfaces/tokens-interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly #httpClient = inject(HttpClient);
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

  logout() {
    return this.#httpClient
      .post<{ message: string }>(`${environment.API_URL}/auth/logout`, {
        token: this.#tokens()?.accessToken,
      })
      .pipe(
        tap(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          this.#tokens.set(undefined);
        })
      );
  }
}
