import { inject, Injectable, resource, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import z from 'zod';
import { TokensResponse } from '../shared/interfaces/tokens-response-interface';
import { UserService } from '../shared/user/user-service';

@Injectable({
  providedIn: 'root',
})
export class AuthCallbackService {
  readonly #userService = inject(UserService);
  code = signal<string | undefined>(undefined);
  authCode = resource<TokensResponse, string | undefined>({
    params: this.code,
    loader: async ({ params }): Promise<TokensResponse> => {
      const res = await fetch(
        `${environment.API_URL}/auth/callback?code=${params}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      const parsedData = this.tokensSchema.parse(data);
      this.#userService.setTokens(parsedData.tokens);
      return {
        message: parsedData.message,
        tokens: parsedData.tokens,
      };
    },
  });

  tokensSchema = z.object({
    message: z.string(),
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
    }),
  });

  setCode(code: string) {
    this.code.set(code);
  }
}
