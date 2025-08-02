import { Component, inject, input, OnInit } from '@angular/core';
import { AuthCallbackService } from './auth-callback-service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  imports: [JsonPipe],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
  providers: [AuthCallbackService],
})
export class AuthCallback implements OnInit {
  readonly #callBackService = inject(AuthCallbackService);
  code = input('');
  tokens = this.#callBackService.authCode;
  ngOnInit(): void {
    // this.#callBackService.code.set(this.code());
    this.#callBackService
      .getAuthCode(this.code())
      .subscribe((res) => console.log(res));
  }
}
