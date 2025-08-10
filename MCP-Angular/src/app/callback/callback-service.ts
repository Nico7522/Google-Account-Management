import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource, signal } from '@angular/core';
import { catchError, lastValueFrom, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from '../shared/toast/toast-service';

@Injectable({
  providedIn: 'root'
})
export class CallbackService {
  readonly #httpClient = inject(HttpClient)
  readonly #toastService = inject(ToastService)

  // Code to echange for tokens
  #code = signal<string | undefined>(undefined)

  // Tokens received from client
  #tokens = resource({
    params: this.#code,
    loader: ({params}) => {
      return this.getTokens(environment.ECHANGE_AUTH_CODE_PROMPT + params)
    }
  })
  tokens = this.#tokens.asReadonly();
  
  /**
   * Method called to echange auth code for tokens
   * @param prompt prompt that tell to echange auth code for token
   * @returns a promise containing the response telling that authentication has succefully been achieved
   */
  getTokens(prompt: string){
    return lastValueFrom(this.#httpClient.post<{response: string}>('/api/tokens', {query: prompt})
    .pipe(
      tap(res => {
        if (res.response === "error") {
          this.#toastService.showToast('error', "Une erreur est survenue.")
        } else {
          this.#toastService.showToast('success', "Authentification réussie.")
          localStorage.setItem('userId', res.response.trim())
        }
      }),
      catchError(err => {
        this.#toastService.showToast('error', "Une erreur est survenue.")
        return of(null)
      })
    
    ))
  }

  /**
   * Method call from component. Set the signal code with the code received from query
   * @param code code to echange
   */
  setCode(code: string) {
    this.#code.set(code)
  }


}
