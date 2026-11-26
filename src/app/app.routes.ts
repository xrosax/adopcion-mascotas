import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'mascotas', pathMatch: 'full' },
  { path: 'login', title: 'Ingresar', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  { path: 'mascotas', title: 'Mascotas', loadComponent: () => import('./pages/mascotas/mascotas').then((m) => m.MascotasPage) },
  {
    path: 'mascotas/publicar', title: 'Publicar mascota', canActivate: [authGuard],
    loadComponent: () => import('./pages/publicar-mascota/publicar-mascota').then((m) => m.PublicarMascotaPage),
  },
  {
    path: 'solicitudes/nueva', title: 'Nueva solicitud', canActivate: [authGuard],
    loadComponent: () => import('./pages/nueva-solicitud/nueva-solicitud').then((m) => m.NuevaSolicitudPage),
  },
  { path: '**', redirectTo: 'mascotas' },
];