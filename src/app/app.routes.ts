import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', title: 'Ingresar', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  // aquí iremos agregando las demás rutas en los siguientes pasos
  { path: '**', redirectTo: 'login' },
];