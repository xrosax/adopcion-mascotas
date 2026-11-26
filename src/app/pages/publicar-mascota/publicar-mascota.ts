import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdopcionService } from '../../services/adopcion.service';
import { AuthService } from '../../services/auth.service';
import { Especie, Tamano } from '../../models/modelos';

/**
 * EXTRA: cualquier usuario con sesión puede publicar una mascota
 * (por ejemplo, un perrito de la calle que tiene en casa temporal).
 * La mascota se crea con estado "Disponible".
 */
@Component({
  selector: 'app-publicar-mascota',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publicar-mascota.html',
})
export class PublicarMascotaPage {
  private fb = inject(FormBuilder);
  private servicio = inject(AdopcionService);
  private auth = inject(AuthService);
  private router = inject(Router);

  foto = signal<string | undefined>(undefined);
  errorFoto = signal('');
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    especie: ['perro' as Especie, Validators.required],
    sexo: ['macho' as 'macho' | 'hembra', Validators.required],
    tamano: ['mediano' as Tamano, Validators.required],
    edadMeses: [1, [Validators.required, Validators.min(1), Validators.max(300)]],
    ubicacion: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(300)]],
  });

  /** Atajo para usar en la plantilla: invalido('nombre') */
  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  /** Lee la imagen elegida y la convierte a base64 para guardarla en IndexedDB. */
  elegirFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    this.errorFoto.set('');
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      this.errorFoto.set('El archivo debe ser una imagen.');
      return;
    }
    if (archivo.size > 1024 * 1024) {
      this.errorFoto.set('La imagen no debe pesar más de 1 MB.');
      return;
    }
    const lector = new FileReader();
    lector.onload = () => this.foto.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.form.getRawValue();
    await this.servicio.publicarMascota({
      ...datos,
      nombre: datos.nombre.trim().toLowerCase(), // se muestra con el pipe titlecase
      foto: this.foto(),
      publicadaPor: this.auth.usuario()!.id!,
    });
    this.router.navigate(['/mascotas']);
  }
}
