import { Injectable, computed, inject, signal } from '@angular/core';
import { DbService } from './db.service';
import { Usuario } from '../models/modelos';

/**
 * AuthService: registro de cuentas, inicio y cierre de sesión.
 *
 * - Las cuentas se guardan en IndexedDB (almacén "usuarios").
 * - La sesión activa (solo el id del usuario) se guarda en localStorage,
 *   así sigue abierta al recargar la página (F5).
 *
 * Nota: es un login de práctica, del lado del cliente. En un sistema real
 * la autenticación se hace en un servidor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private db = inject(DbService);
  private readonly CLAVE_SESION = 'huellitas-sesion';

  /** Usuario conectado (signal: la vista se actualiza sola cuando cambia). */
  readonly usuario = signal<Usuario | null>(null);
  readonly logueado = computed(() => this.usuario() !== null);

  /** Promesa que termina cuando se restauró la sesión guardada. */
  readonly listo: Promise<void> = this.restaurarSesion();

  private async restaurarSesion(): Promise<void> {
    const id = Number(localStorage.getItem(this.CLAVE_SESION));
    if (id) {
      const u = await this.db.obtenerPorId<Usuario>('usuarios', id);
      this.usuario.set(u ?? null);
    }
  }

  /** Convierte la contraseña en un hash SHA-256 (no se guarda en texto plano). */
  private async hash(texto: string): Promise<string> {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async registrar(nombre: string, email: string, password: string, telefono: string): Promise<void> {
    email = email.trim().toLowerCase();
    const existentes = await this.db.obtenerPorIndice<Usuario>('usuarios', 'email', email);
    if (existentes.length > 0) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }
    const nuevo: Usuario = { nombre: nombre.trim(), email, telefono, passwordHash: await this.hash(password) };
    nuevo.id = await this.db.agregar('usuarios', nuevo);
    this.iniciarSesion(nuevo);
  }

  async login(email: string, password: string): Promise<void> {
    const [u] = await this.db.obtenerPorIndice<Usuario>('usuarios', 'email', email.trim().toLowerCase());
    if (!u || u.passwordHash !== (await this.hash(password))) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    this.iniciarSesion(u);
  }

  logout(): void {
    localStorage.removeItem(this.CLAVE_SESION);
    this.usuario.set(null);
  }

  private iniciarSesion(u: Usuario): void {
    localStorage.setItem(this.CLAVE_SESION, String(u.id));
    this.usuario.set(u);
  }
}
