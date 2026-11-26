import { Injectable, inject } from '@angular/core';
import { DbService } from './db.service';
import { Mascota, Solicitud, EstadoSolicitud } from '../models/modelos';

/**
 * AdopcionService: aquí están las REGLAS DEL NEGOCIO.
 *
 * Regla principal del examen:
 *   Una mascota pasa a "En proceso" al recibir una solicitud y no acepta
 *   más solicitudes hasta que esa solicitud se rechace o se cancele.
 *
 * Los componentes NUNCA tocan IndexedDB directamente: le piden todo a este
 * servicio, y este servicio usa DbService.
 */
@Injectable({ providedIn: 'root' })
export class AdopcionService {
  private db = inject(DbService);

  // ===================== MASCOTAS =====================

  async listarMascotas(): Promise<Mascota[]> {
    const lista = await this.db.obtenerTodos<Mascota>('mascotas');
    // Las más recientes primero
    return lista.sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion));
  }

  obtenerMascota(id: number): Promise<Mascota | undefined> {
    return this.db.obtenerPorId<Mascota>('mascotas', id);
  }

  /** Publica una mascota (por ejemplo, un perrito callejero en casa temporal). */
  publicarMascota(datos: Omit<Mascota, 'id' | 'estado' | 'fechaPublicacion'>): Promise<number> {
    const nueva: Mascota = { ...datos, estado: 'Disponible', fechaPublicacion: new Date().toISOString() };
    return this.db.agregar('mascotas', nueva);
  }

  // ===================== SOLICITUDES =====================

  async listarSolicitudesDeUsuario(usuarioId: number): Promise<Solicitud[]> {
    const lista = await this.db.obtenerPorIndice<Solicitud>('solicitudes', 'usuarioId', usuarioId);
    return lista.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /** Solicitudes que otras personas enviaron para las mascotas que YO publiqué. */
  async listarSolicitudesRecibidas(usuarioId: number): Promise<Solicitud[]> {
    const mias = (await this.listarMascotas()).filter((m) => m.publicadaPor === usuarioId);
    const ids = new Set(mias.map((m) => m.id));
    const todas = await this.db.obtenerTodos<Solicitud>('solicitudes');
    return todas.filter((s) => ids.has(s.mascotaId)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  obtenerSolicitud(id: number): Promise<Solicitud | undefined> {
    return this.db.obtenerPorId<Solicitud>('solicitudes', id);
  }

  /**
   * Crea una solicitud aplicando las reglas del tema.
   * Si alguna regla no se cumple, lanza un Error con el mensaje para el usuario.
   */
  async crearSolicitud(datos: Omit<Solicitud, 'id' | 'estado' | 'fecha'>): Promise<number> {
    const mascota = await this.obtenerMascota(datos.mascotaId);
    if (!mascota) {
      throw new Error('La mascota seleccionada no existe.');
    }
    if (mascota.publicadaPor === datos.usuarioId) {
      throw new Error('No puedes solicitar la adopción de una mascota que tú publicaste.');
    }
    // REGLA PRINCIPAL: solo se acepta si está "Disponible"
    if (mascota.estado !== 'Disponible') {
      throw new Error(`${mascota.nombre} está "${mascota.estado}" y no acepta nuevas solicitudes.`);
    }

    const solicitud: Solicitud = { ...datos, estado: 'Pendiente', fecha: new Date().toISOString() };
    let nuevoId = 0;

    // Guardamos la solicitud y cambiamos la mascota en UNA sola transacción
    await this.db.transaccion(['solicitudes', 'mascotas'], (tx) => {
      const pet = tx.objectStore('solicitudes').add(solicitud);
      pet.onsuccess = () => (nuevoId = pet.result as number);
      tx.objectStore('mascotas').put({ ...mascota, estado: 'En proceso' });
    });
    return nuevoId;
  }

  /**
   * Cambia el estado de una solicitud y aplica la consecuencia en la mascota:
   *   - Cancelada / Rechazada  -> la mascota vuelve a "Disponible"
   *   - Aprobada               -> la mascota pasa a "Adoptada"
   * Solo se puede cambiar una solicitud "Pendiente" (control de repetición:
   * no se puede cancelar dos veces ni aprobar algo ya cancelado).
   */
  async cambiarEstado(solicitudId: number, nuevoEstado: Exclude<EstadoSolicitud, 'Pendiente'>): Promise<void> {
    const solicitud = await this.obtenerSolicitud(solicitudId);
    if (!solicitud) {
      throw new Error('La solicitud no existe.');
    }
    if (solicitud.estado !== 'Pendiente') {
      throw new Error(`Esta solicitud ya fue ${solicitud.estado.toLowerCase()}. No se puede modificar otra vez.`);
    }
    const mascota = await this.obtenerMascota(solicitud.mascotaId);
    if (!mascota) {
      throw new Error('La mascota de esta solicitud ya no existe.');
    }

    const estadoMascota = nuevoEstado === 'Aprobada' ? 'Adoptada' : 'Disponible';

    await this.db.transaccion(['solicitudes', 'mascotas'], (tx) => {
      tx.objectStore('solicitudes').put({
        ...solicitud,
        estado: nuevoEstado,
        fechaActualizacion: new Date().toISOString(),
      });
      tx.objectStore('mascotas').put({ ...mascota, estado: estadoMascota });
    });
  }
}
