import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  readonly #error = signal('');
  error = this.#error.asReadonly();

  setError(errorMessage: string) {
    this.#error.set(errorMessage);
  }
}
