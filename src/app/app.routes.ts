import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/**
 * RUTAS DE LA APLICACIÓN
 * - ''                  -> ruta inicial, redirige a /mascotas
 * - /mascotas           -> 1. Consulta principal (pública)
 * - /solicitudes/nueva  -> 2. Registro de solicitud (requiere login)
 * - /solicitudes        -> 3. Historial (requiere login)
 * - /solicitudes/:id    -> 4. Detalle y actualización (requiere login)
 * - /mascotas/publicar  -> extra: publicar una mascota
 * - /login              -> iniciar sesión / crear cuenta
 *
 * loadComponent carga cada pantalla solo cuando se visita (lazy loading).
 * IMPORTANTE: 'solicitudes/nueva' va ANTES que 'solicitudes/:id',
 * si no, Angular pensaría que "nueva" es un id.
 */
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
  {
    path: 'solicitudes', title: 'Historial', canActivate: [authGuard],
    loadComponent: () => import('./pages/historial/historial').then((m) => m.HistorialPage),
  },
  {
    path: 'solicitudes/:id', title: 'Detalle de solicitud', canActivate: [authGuard],
    loadComponent: () => import('./pages/detalle-solicitud/detalle-solicitud').then((m) => m.DetalleSolicitudPage),
  },
  { path: '**', redirectTo: 'mascotas' },
];
