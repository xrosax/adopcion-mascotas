import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdopcionService } from '../../services/adopcion.service';
import { AuthService } from '../../services/auth.service';
import { DbService } from '../../services/db.service';
import { EstadoSolicitud, Mascota, Solicitud, Usuario } from '../../models/modelos';
import { EstadoBadge } from '../../components/estado-badge/estado-badge';

/**
 * PANTALLA 4 - DETALLE Y ACTUALIZACIÓN  (/solicitudes/:id)
 *
 * - El :id llega como input() gracias a withComponentInputBinding().
 * - Los datos se leen desde IndexedDB, por eso funciona al recargar (F5).
 * - Si el id no existe: mensaje + botón para volver.
 * Acciones:
 *   - Quien envió la solicitud puede CANCELARLA  -> mascota vuelve a "Disponible".
 *   - Quien publicó la mascota puede APROBAR (-> "Adoptada") o RECHAZAR (-> "Disponible").
 */
@Component({
  selector: 'app-detalle-solicitud',
  imports: [DatePipe, TitleCasePipe, UpperCasePipe, RouterLink, EstadoBadge],
  templateUrl: './detalle-solicitud.html',
})
export class DetalleSolicitudPage {
  private servicio = inject(AdopcionService);
  private db = inject(DbService);
  private auth = inject(AuthService);
  private ruta = inject(ActivatedRoute);

  /** Viene de la URL: /solicitudes/5  ->  id = "5" */
  id = input.required<string>();

  solicitud = signal<Solicitud | null>(null);
  mascota = signal<Mascota | null>(null);
  solicitante = signal<Usuario | null>(null);
  cargando = signal(true);
  noExiste = signal(false);
  mensaje = signal('');
  error = signal('');
  procesando = signal(false);

  /** Mostramos un aviso si acabamos de crearla (?nueva=1). */
  recienCreada = this.ruta.snapshot.queryParamMap.has('nueva');

  esSolicitante = computed(() => this.solicitud()?.usuarioId === this.auth.usuario()?.id);
  esPublicador = computed(() => this.mascota()?.publicadaPor === this.auth.usuario()?.id);
  pendiente = computed(() => this.solicitud()?.estado === 'Pendiente');

  constructor() {
    // Cada vez que cambia el id de la ruta, volvemos a cargar
    effect(() => {
      this.cargar(Number(this.id()));
    });
  }

  private async cargar(id: number): Promise<void> {
    this.cargando.set(true);
    const s = Number.isInteger(id) && id > 0 ? await this.servicio.obtenerSolicitud(id) : undefined;
    // Solo pueden verla el solicitante o quien publicó la mascota
    const m = s ? await this.servicio.obtenerMascota(s.mascotaId) : undefined;
    const miId = this.auth.usuario()?.id;
    if (!s || (s.usuarioId !== miId && m?.publicadaPor !== miId)) {
      this.noExiste.set(true);
      this.cargando.set(false);
      return;
    }
    this.solicitud.set(s);
    this.mascota.set(m ?? null);
    this.solicitante.set((await this.db.obtenerPorId<Usuario>('usuarios', s.usuarioId)) ?? null);
    this.noExiste.set(false);
    this.cargando.set(false);
  }

  async cambiar(estado: Exclude<EstadoSolicitud, 'Pendiente'>): Promise<void> {
    const preguntas = {
      Cancelada: '¿Seguro que quieres cancelar tu solicitud?',
      Rechazada: '¿Rechazar esta solicitud? La mascota volverá a estar disponible.',
      Aprobada: '¿Aprobar esta adopción? La mascota quedará como adoptada.',
    };
    if (!confirm(preguntas[estado])) return;

    this.error.set('');
    this.mensaje.set('');
    this.recienCreada = false;
    this.procesando.set(true);
    try {
      await this.servicio.cambiarEstado(this.solicitud()!.id!, estado);
      await this.cargar(this.solicitud()!.id!); // recargamos para ver el cambio
      const n = this.mascota()?.nombre ?? 'la mascota';
      const nombre = n.charAt(0).toUpperCase() + n.slice(1);
      this.mensaje.set(
        estado === 'Aprobada'
          ? `¡Adopción aprobada! ${nombre} ahora está "Adoptada".`
          : `Solicitud ${estado.toLowerCase()}. ${nombre} vuelve a estar "Disponible" para otras personas.`,
      );
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.procesando.set(false);
    }
  }
}
