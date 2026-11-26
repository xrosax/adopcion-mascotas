import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdopcionService } from '../../services/adopcion.service';
import { AuthService } from '../../services/auth.service';
import { Mascota } from '../../models/modelos';
import { MascotaCard } from '../../components/mascota-card/mascota-card';

/**
 * PANTALLA 1 - CONSULTA PRINCIPAL
 * Muestra las mascotas en tarjetas, con búsqueda por texto + filtro por especie
 * + filtro por estado. Los tres filtros funcionan JUNTOS (computed).
 */
@Component({
  selector: 'app-mascotas',
  imports: [MascotaCard, RouterLink],
  templateUrl: './mascotas.html',
})
export class MascotasPage implements OnInit {
  private servicio = inject(AdopcionService);
  private router = inject(Router);
  auth = inject(AuthService);

  mascotas = signal<Mascota[]>([]);
  cargando = signal(true);

  // Valores de los filtros
  texto = signal('');
  especie = signal('');
  estado = signal('Disponible');

  /** Lista filtrada: se recalcula sola cuando cambia cualquier filtro. */
  filtradas = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.mascotas().filter((m) =>
      (!t || m.nombre.toLowerCase().includes(t) || m.descripcion.toLowerCase().includes(t)
          || m.ubicacion.toLowerCase().includes(t)) &&
      (!this.especie() || m.especie === this.especie()) &&
      (!this.estado() || m.estado === this.estado()),
    );
  });

  async ngOnInit(): Promise<void> {
    this.mascotas.set(await this.servicio.listarMascotas());
    this.cargando.set(false);
  }

  limpiar(): void {
    this.texto.set('');
    this.especie.set('');
    this.estado.set('');
  }

  /** Se ejecuta cuando el componente hijo emite el evento (solicitar). */
  irASolicitar(m: Mascota): void {
    this.router.navigate(['/solicitudes/nueva'], { queryParams: { mascota: m.id } });
  }
}
