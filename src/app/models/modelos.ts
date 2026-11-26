// Modelos (interfaces) que usa toda la aplicación.

export type Especie = 'perro' | 'gato' | 'otro';
export type Tamano = 'pequeño' | 'mediano' | 'grande';

/** Estados de una mascota */
export type EstadoMascota = 'Disponible' | 'En proceso' | 'Adoptada';

/** Estados de una solicitud de adopción */
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada';

export interface Usuario {
  id?: number;            // lo genera IndexedDB (autoIncrement)
  nombre: string;
  email: string;
  passwordHash: string;   // nunca guardamos la contraseña en texto plano
  telefono: string;
}

export interface Mascota {
  id?: number;
  nombre: string;
  especie: Especie;
  edadMeses: number;
  tamano: Tamano;
  sexo: 'macho' | 'hembra';
  descripcion: string;
  ubicacion: string;          // zona o barrio donde está (casa temporal)
  foto?: string;              // imagen en base64 (opcional)
  estado: EstadoMascota;
  publicadaPor: number;       // id del usuario que la publicó
  fechaPublicacion: string;   // fecha en formato ISO
}

export interface Solicitud {
  id?: number;
  mascotaId: number;
  usuarioId: number;          // quién quiere adoptar
  motivo: string;
  tipoVivienda: 'casa' | 'departamento' | 'cuarto';
  tienePatio: boolean;
  telefono: string;
  estado: EstadoSolicitud;
  fecha: string;              // fecha de creación (ISO)
  fechaActualizacion?: string;
}
