import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  readonly #error = signal('');
  error = this.#error.asReadonly();
  isToastVisible = signal(false);
  showError(errorMessage: string) {
    this.#error.set(errorMessage);
    setTimeout(() => this.isToastVisible.set(true), 100);
    setTimeout(() => this.removeError(), 3000);
  }

  removeError() {
    this.#error.set('');
    this.isToastVisible.set(false);
  }
}
