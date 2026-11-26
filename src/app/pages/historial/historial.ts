import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdopcionService } from '../../services/adopcion.service';
import { AuthService } from '../../services/auth.service';
import { Mascota, Solicitud } from '../../models/modelos';
import { EstadoBadge } from '../../components/estado-badge/estado-badge';

/**
 * PANTALLA 3 - HISTORIAL / SEGUIMIENTO
 * Pestaña "Enviadas": solicitudes que YO hice.
 * Pestaña "Recibidas": solicitudes para las mascotas que YO publiqué.
 * Se pueden filtrar por estado y abrir el detalle de cada una.
 */
@Component({
  selector: 'app-historial',
  imports: [DatePipe, TitleCasePipe, RouterLink, EstadoBadge],
  templateUrl: './historial.html',
})
export class HistorialPage implements OnInit {
  private servicio = inject(AdopcionService);
  private auth = inject(AuthService);
  private router = inject(Router);

  enviadas = signal<Solicitud[]>([]);
  recibidas = signal<Solicitud[]>([]);
  mascotas = signal<Map<number, Mascota>>(new Map());
  cargando = signal(true);

  pestana = signal<'enviadas' | 'recibidas'>('enviadas');
  filtroEstado = signal('');

  readonly estados = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'];

  /** Lista visible según la pestaña y el filtro de estado. */
  lista = computed(() => {
    const base = this.pestana() === 'enviadas' ? this.enviadas() : this.recibidas();
    return this.filtroEstado() ? base.filter((s) => s.estado === this.filtroEstado()) : base;
  });

  async ngOnInit(): Promise<void> {
    const id = this.auth.usuario()!.id!;
    const [enviadas, recibidas, mascotas] = await Promise.all([
      this.servicio.listarSolicitudesDeUsuario(id),
      this.servicio.listarSolicitudesRecibidas(id),
      this.servicio.listarMascotas(),
    ]);
    this.enviadas.set(enviadas);
    this.recibidas.set(recibidas);
    this.mascotas.set(new Map(mascotas.map((m) => [m.id!, m])));
    this.cargando.set(false);
  }

  nombreMascota(id: number): string {
    return this.mascotas().get(id)?.nombre ?? '(eliminada)';
  }

  abrir(s: Solicitud): void {
    this.router.navigate(['/solicitudes', s.id]);
  }
}
