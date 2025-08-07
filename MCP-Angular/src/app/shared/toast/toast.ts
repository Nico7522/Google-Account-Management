import { Component, inject } from '@angular/core';
import { ToastService } from './toast-service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  readonly toastService = inject(ToastService);
  toast = this.toastService.toast;
  isToastVisible = this.toastService.isToastVisible;
}
