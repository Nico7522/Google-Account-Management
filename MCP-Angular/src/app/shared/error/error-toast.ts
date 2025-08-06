import { Component, inject } from '@angular/core';
import { ErrorService } from './error-service/error-service';

@Component({
  selector: 'app-error-toast',
  imports: [],
  templateUrl: './error-toast.html',
  styleUrl: './error-toast.scss',
})
export class ErrorToast {
  readonly #errorService = inject(ErrorService);
  errorMessage = this.#errorService.error;
  isToastVisible = this.#errorService.isToastVisible;
}
