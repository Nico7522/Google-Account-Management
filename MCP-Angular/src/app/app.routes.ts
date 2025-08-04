import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth-callback/auth-callback').then((m) => m.AuthCallback),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat').then((m) => m.Chat),
  },
];
