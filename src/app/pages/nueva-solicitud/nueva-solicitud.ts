import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdopcionService } from '../../services/adopcion.service';
import { AuthService } from '../../services/auth.service';
import { Mascota } from '../../models/modelos';
import { EstadoBadge } from '../../components/estado-badge/estado-badge';

/**
 * PANTALLA 2 - REGISTRO DE UNA OPERACIÓN (solicitud de adopción)
 *
 * Validaciones del formulario: campos obligatorios, longitud, formato del celular.
 * Reglas propias del tema (en AdopcionService.crearSolicitud):
 *   - La mascota debe estar "Disponible".
 *   - No puedes adoptar una mascota que tú publicaste.
 *   - Un perro grande necesita patio (regla extra, validada aquí).
 */
@Component({
  selector: 'app-nueva-solicitud',
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe, EstadoBadge],
  templateUrl: './nueva-solicitud.html',
})
export class NuevaSolicitudPage implements OnInit {
  private fb = inject(FormBuilder);
  private servicio = inject(AdopcionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  /** Mascotas que se pueden elegir: disponibles y que no son mías. */
  disponibles = signal<Mascota[]>([]);
  error = signal('');
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    mascotaId: [0, [Validators.required, Validators.min(1)]],
    tipoVivienda: ['casa' as 'casa' | 'departamento' | 'cuarto', Validators.required],
    tienePatio: [false],
    telefono: [this.auth.usuario()?.telefono ?? '', [Validators.required, Validators.pattern(/^[67]\d{7}$/)]],
    motivo: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(400)]],
    compromiso: [false, Validators.requiredTrue],
  });

  /** Mascota elegida en el select (para mostrar su resumen). */
  private idElegido = signal(0);
  elegida = computed(() => this.disponibles().find((m) => m.id === this.idElegido()));

  async ngOnInit(): Promise<void> {
    const miId = this.auth.usuario()!.id;
    const todas = await this.servicio.listarMascotas();
    this.disponibles.set(todas.filter((m) => m.estado === 'Disponible' && m.publicadaPor !== miId));

    // Si venimos desde una tarjeta: /solicitudes/nueva?mascota=3
    const id = Number(this.ruta.snapshot.queryParamMap.get('mascota'));
    if (id) {
      if (this.disponibles().some((m) => m.id === id)) {
        this.form.controls.mascotaId.setValue(id);
      } else {
        this.error.set('La mascota que elegiste ya no está disponible. Elige otra de la lista.');
      }
    }
    this.idElegido.set(this.form.controls.mascotaId.value);
    this.form.controls.mascotaId.valueChanges.subscribe((v) => this.idElegido.set(Number(v)));
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  /** Regla extra del tema: un perro grande necesita casa con patio. */
  faltaPatio(): boolean {
    const m = this.elegida();
    return !!m && m.especie === 'perro' && m.tamano === 'grande' && !this.form.controls.tienePatio.value;
  }

  async enviar(): Promise<void> {
    this.error.set('');
    if (this.form.invalid || this.faltaPatio()) {
      this.form.markAllAsTouched();
      return; // impide guardar una operación inválida
    }
    this.guardando.set(true);
    try {
      const { compromiso, ...datos } = this.form.getRawValue();
      const id = await this.servicio.crearSolicitud({
        ...datos,
        mascotaId: Number(datos.mascotaId),
        motivo: datos.motivo.trim(),
        usuarioId: this.auth.usuario()!.id!,
      });
      this.router.navigate(['/solicitudes', id], { queryParams: { nueva: 1 } });
    } catch (e) {
      this.error.set((e as Error).message); // mensaje de la regla que no se cumplió
    } finally {
      this.guardando.set(false);
    }
  }
}
