import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly #httpClient = inject(HttpClient);
  logout() {
    return this.#httpClient.post<unknown>('/api/logout', {}, {withCredentials: true})
  }
}
