import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

/** Componente raíz: contiene el menú de navegación y el <router-outlet>. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // En celular: cerrar el menú desplegable al cambiar de página
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        document.getElementById('menu')?.classList.remove('show');
      }
    });
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
