import { Injectable, signal } from '@angular/core';
import { ToastType } from '../models/toast-type';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toast = signal<{ type: ToastType; message: string } | null>(null);
  isToastVisible = signal(false);
  showToast(type: ToastType, message: string): void {
    this.toast.set({ type, message });
    setTimeout(() => this.isToastVisible.set(true), 100);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
