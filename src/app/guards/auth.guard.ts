import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard: protege rutas que necesitan sesión.
 * Si no hay usuario conectado, lo manda a /login y recuerda a dónde quería ir.
 */
export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo; // esperamos a que se restaure la sesión (importante al recargar)

  if (auth.logueado()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};
