import { Injectable } from '@angular/core';
import { Mascota, Usuario } from '../models/modelos';

/**
 * DbService: la ÚNICA clase que habla directamente con IndexedDB.
 *
 * IndexedDB es una base de datos que vive dentro del navegador.
 * Los datos NO se borran al cerrar la pestaña ni al apagar la computadora.
 *
 * Tiene "almacenes" (object stores), parecidos a las tablas de SQL:
 *   - usuarios
 *   - mascotas
 *   - solicitudes
 *
 * La API original de IndexedDB trabaja con eventos (onsuccess, onerror).
 * Aquí la "envolvemos" en Promesas para poder usar async/await.
 */
@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly NOMBRE_BD = 'huellitas-db';
  private readonly VERSION = 1;
  private conexion?: Promise<IDBDatabase>;

  /** Abre la base de datos (solo una vez) y la reutiliza. */
  private abrir(): Promise<IDBDatabase> {
    if (!this.conexion) {
      this.conexion = new Promise((resolve, reject) => {
        const peticion = indexedDB.open(this.NOMBRE_BD, this.VERSION);

        // Se ejecuta SOLO cuando la base se crea por primera vez
        // (o cuando subimos VERSION). Aquí se crean los almacenes y
        // se cargan los datos iniciales => se cargan UNA SOLA VEZ.
        peticion.onupgradeneeded = () => {
          const db = peticion.result;

          const usuarios = db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
          usuarios.createIndex('email', 'email', { unique: true });

          const mascotas = db.createObjectStore('mascotas', { keyPath: 'id', autoIncrement: true });
          mascotas.createIndex('estado', 'estado');

          const solicitudes = db.createObjectStore('solicitudes', { keyPath: 'id', autoIncrement: true });
          solicitudes.createIndex('mascotaId', 'mascotaId');
          solicitudes.createIndex('usuarioId', 'usuarioId');

          this.cargarDatosIniciales(usuarios, mascotas);
        };

        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
      });
    }
    return this.conexion;
  }

  /** Convierte un IDBRequest (basado en eventos) en una Promesa. */
  private aPromesa<T>(peticion: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      peticion.onsuccess = () => resolve(peticion.result);
      peticion.onerror = () => reject(peticion.error);
    });
  }

  // ---------- Operaciones genéricas (sirven para cualquier almacén) ----------

  async obtenerTodos<T>(almacen: string): Promise<T[]> {
    const db = await this.abrir();
    return this.aPromesa(db.transaction(almacen, 'readonly').objectStore(almacen).getAll());
  }

  async obtenerPorId<T>(almacen: string, id: number): Promise<T | undefined> {
    const db = await this.abrir();
    return this.aPromesa(db.transaction(almacen, 'readonly').objectStore(almacen).get(id));
  }

  async obtenerPorIndice<T>(almacen: string, indice: string, valor: IDBValidKey): Promise<T[]> {
    const db = await this.abrir();
    const store = db.transaction(almacen, 'readonly').objectStore(almacen);
    return this.aPromesa(store.index(indice).getAll(valor));
  }

  /** Inserta un registro nuevo y devuelve el id generado. */
  async agregar<T>(almacen: string, dato: T): Promise<number> {
    const db = await this.abrir();
    const id = await this.aPromesa(db.transaction(almacen, 'readwrite').objectStore(almacen).add(dato));
    return id as number;
  }

  /** Actualiza un registro existente (put reemplaza el registro con ese id). */
  async actualizar<T>(almacen: string, dato: T): Promise<void> {
    const db = await this.abrir();
    await this.aPromesa(db.transaction(almacen, 'readwrite').objectStore(almacen).put(dato));
  }

  /**
   * Ejecuta varias operaciones dentro de UNA transacción.
   * Si algo falla, IndexedDB deshace todo (o se guarda todo, o nada).
   * Lo usamos para cambiar la solicitud y la mascota al mismo tiempo.
   */
  async transaccion(almacenes: string[], trabajo: (tx: IDBTransaction) => void): Promise<void> {
    const db = await this.abrir();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(almacenes, 'readwrite');
      trabajo(tx);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // ---------- Datos de ejemplo (solo la primera vez) ----------

  private cargarDatosIniciales(usuarios: IDBObjectStore, mascotas: IDBObjectStore): void {
    // Usuario "refugio" que publica las mascotas de ejemplo.
    // Su contraseña es: refugio123  (hash SHA-256 precalculado)
    const refugio: Usuario = {
      nombre: 'Refugio Huellitas',
      email: 'refugio@huellitas.bo',
      passwordHash: 'cde8c765ccc2c4df9ff7ddfaabd3eb75dec43244912be09b378a59c8e9de1d4a',
      telefono: '70000000',
    };
    usuarios.add(refugio); // recibirá id = 1

    const hoy = Date.now();
    const dia = 24 * 60 * 60 * 1000;
    const base = (n: number) => new Date(hoy - n * dia).toISOString();

    const ejemplos: Mascota[] = [
      { nombre: 'firulais', especie: 'perro', edadMeses: 24, tamano: 'mediano', sexo: 'macho',
        descripcion: 'Rescatado de la calle, muy cariñoso y juguetón. Vacunado.',
        ubicacion: 'Zona Norte', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(10) },
      { nombre: 'luna', especie: 'gato', edadMeses: 8, tamano: 'pequeño', sexo: 'hembra',
        descripcion: 'Gatita tranquila, ideal para departamento.',
        ubicacion: 'Centro', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(7) },
      { nombre: 'rocky', especie: 'perro', edadMeses: 60, tamano: 'grande', sexo: 'macho',
        descripcion: 'Perro guardián, noble con niños. Necesita patio.',
        ubicacion: 'Zona Sur', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(5) },
      { nombre: 'nala', especie: 'perro', edadMeses: 4, tamano: 'pequeño', sexo: 'hembra',
        descripcion: 'Cachorrita encontrada en el mercado Bolívar, está en casa temporal.',
        ubicacion: 'Zona Este', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(3) },
      { nombre: 'michi', especie: 'gato', edadMeses: 36, tamano: 'mediano', sexo: 'macho',
        descripcion: 'Gato adulto, esterilizado, muy independiente.',
        ubicacion: 'Zona Oeste', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(2) },
      { nombre: 'copito', especie: 'otro', edadMeses: 12, tamano: 'pequeño', sexo: 'macho',
        descripcion: 'Conejo blanco, come verduras y heno.',
        ubicacion: 'Centro', estado: 'Disponible', publicadaPor: 1, fechaPublicacion: base(1) },
    ];
    ejemplos.forEach((m) => mascotas.add(m));
  }
}
