import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource } from '@angular/core';
import { catchError, EMPTY, lastValueFrom, tap } from 'rxjs';
import { ToastService } from '../../toast/toast-service';

@Injectable({
  providedIn: 'root',
})
export class McpService {
  readonly #httpClient = inject(HttpClient);
  readonly #toastService = inject(ToastService);
  /**
   * Signal that holds the server status and tools.
   * It is initialized with a resource that fetches the server information.
   */
  #serverInfo = resource({
    loader: () => this.#getServerInfo(),
  });
  serverInfo = this.#serverInfo.asReadonly();

  /**
   * Fetches the server status and tools.
   * @returns A promise that resolves to an object containing the server status and tools.
   */
  #getServerInfo(): Promise<{ status: string; tools: string[] }> {
    return lastValueFrom(
      this.#httpClient.get<{ status: string; tools: string[] }>('/api/health').pipe(
        tap(() => this.#toastService.showToast('success', 'Serveur connecté')),
        catchError(() => {
          this.#toastService.showToast('error', 'Serveur hors ligne');
          return EMPTY;
        })
      )
    );
  }
}
