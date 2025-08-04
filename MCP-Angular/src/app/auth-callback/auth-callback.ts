import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { AuthCallbackService } from './auth-callback-service';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  imports: [RouterLink, RouterModule],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.scss',
})
export class AuthCallback implements OnInit {
  readonly #callBackService = inject(AuthCallbackService);
  code = input.required<string>();
  tokens = this.#callBackService.authCode;
  ngOnInit(): void {
    if (this.code()) {
      this.#callBackService.setCode(this.code());
    }
  }
}
