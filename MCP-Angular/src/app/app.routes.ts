import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat').then(m => m.Chat),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./callback/callback').then(m => m.Callback),
  },
];
