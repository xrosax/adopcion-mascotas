import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * Componente hijo pequeño: muestra un estado con su color.
 * Recibe el estado desde el padre con input().
 * Usa la directiva ngClass para cambiar el color según el estado.
 */
@Component({
  selector: 'app-estado-badge',
  imports: [NgClass],
  template: `
    <span class="badge rounded-pill" [ngClass]="{
      'estado-disponible': estado() === 'Disponible' || estado() === 'Aprobada',
      'estado-proceso':    estado() === 'En proceso' || estado() === 'Pendiente',
      'estado-adoptada':   estado() === 'Adoptada',
      'estado-rechazada':  estado() === 'Rechazada',
      'estado-cancelada':  estado() === 'Cancelada'
    }">{{ estado() }}</span>
  `,
})
export class EstadoBadge {
  /** input obligatorio: el padre DEBE enviarlo -> <app-estado-badge [estado]="..."> */
  estado = input.required<string>();
}
