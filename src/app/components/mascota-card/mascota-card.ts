import { Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Mascota } from '../../models/modelos';
import { EstadoBadge } from '../estado-badge/estado-badge';

/**
 * COMPONENTE HIJO REUTILIZABLE: tarjeta de una mascota.
 *
 *  Padre -> Hijo : recibe la mascota con input()
 *  Hijo -> Padre : avisa con output() cuando el usuario pulsa "Solicitar adopción"
 *
 * Uso en el padre:
 *   <app-mascota-card [mascota]="m" (solicitar)="irASolicitar($event)" />
 */
@Component({
  selector: 'app-mascota-card',
  imports: [TitleCasePipe, EstadoBadge],
  templateUrl: './mascota-card.html',
})
export class MascotaCard {
  mascota = input.required<Mascota>();
  /** Si es true, el botón aparece desactivado (por ejemplo, es mi propia mascota). */
  esMia = input(false);

  /** Evento que el padre escucha. Envía la mascota elegida. */
  solicitar = output<Mascota>();

  pulsarSolicitar(): void {
    this.solicitar.emit(this.mascota());
  }

  /** 8 -> "8 meses", 24 -> "2 años" */
  edadTexto(): string {
    const m = this.mascota().edadMeses;
    if (m < 12) return m === 1 ? '1 mes' : `${m} meses`;
    const a = Math.floor(m / 12);
    return a === 1 ? '1 año' : `${a} años`;
  }

  iconoEspecie(): string {
    const e = this.mascota().especie;
    return e === 'perro' ? '🐶' : e === 'gato' ? '🐱' : '🐰';
  }
}
