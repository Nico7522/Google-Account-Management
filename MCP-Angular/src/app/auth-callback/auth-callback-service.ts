import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthCallbackService {
  readonly #httpClient = inject(HttpClient);
  code = signal(
    '4/0AVMBsJg4BgJsrrl5zAPdE8dYy_UKdu2h1Ywp0HiCfcMdu8aqUciuIo87_2CjzVogWDlgyg'
  );
  authCode = resource({
    params: () => ({
      code: this.code(),
    }),
    loader: async ({
      params,
    }): Promise<{ accessToken: string; refreshToken: string }> => {
      const res = await fetch(
        `${environment.API_URL}/auth/login/callback?code=${params.code}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).then((response) => {
        return response.json();
      });

      return {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      };
    },
  });
  getAuthCode(code: string) {
    return this.#httpClient.get<{ accessToken: string; refreshToken: string }>(
      `${environment.API_URL}/auth/login/callback?code=${code}`
    );
  }
}
