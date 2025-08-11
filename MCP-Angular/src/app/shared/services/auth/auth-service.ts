import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { StorageService } from '../storage/storage-service';
import { catchError, EMPTY, of, tap } from 'rxjs';
import { ToastService } from '../../toast/toast-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly #httpClient = inject(HttpClient);
  readonly #storageService = inject(StorageService);
  readonly #toastService = inject(ToastService);
  logout() {
    const userId = this.#storageService.userId();
    if (!userId) {
      this.#toastService.showToast('error', 'Vous n\'êtes pas connecté');
      return of(undefined);
    }
    return this.#httpClient.post<unknown>('/api/chat', {query: `Logout userId: ${userId}`})
    .pipe(
      tap(() => {
        this.#storageService.removeUserId(userId);
        this.#toastService.showToast('success', 'Vous avez été déconnecté');
      }),
      catchError((error) => {
        this.#toastService.showToast('error', 'Une erreur est survenue lors de la déconnexion');
        return EMPTY;
      })
    )
  }
}
