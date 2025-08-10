import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  readonly #platformId = inject(PLATFORM_ID);
  // Signal to store the user id
  #userId = signal<string | undefined>(this.#getUserId());
  // Readonly signal to get the user id
  userId = this.#userId.asReadonly();
  // Computed signal to know if the user is logged in
  isLoggedIn = computed(() => this.#userId() !== undefined);


  removeUserId(userId: string) {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }
    localStorage.removeItem('userId');
    this.#userId.set(undefined);
  }

  /**
   * Get the user id from the local storage
   * @returns The user id or undefined if the platform is not browser or if the user id is not in the local storage
   */
  #getUserId() {
    if (!isPlatformBrowser(this.#platformId)) {
      return undefined;
    }
    
    return localStorage.getItem('userId') ?? undefined;
  }
}
