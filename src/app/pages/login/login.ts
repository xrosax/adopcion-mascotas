import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Pantalla de inicio de sesión y creación de cuenta (formularios reactivos). */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  modo = signal<'login' | 'registro'>('login');
  error = signal('');
  cargando = signal(false);

  formLogin = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  formRegistro = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[67]\d{7}$/)]], // celular de Bolivia
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  cambiarModo(m: 'login' | 'registro'): void {
    this.modo.set(m);
    this.error.set('');
  }

  async ingresar(): Promise<void> {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched(); // muestra los mensajes de error
      return;
    }
    const { email, password } = this.formLogin.getRawValue();
    await this.ejecutar(() => this.auth.login(email, password));
  }

  async crearCuenta(): Promise<void> {
    if (this.formRegistro.invalid) {
      this.formRegistro.markAllAsTouched();
      return;
    }
    const { nombre, email, password, telefono } = this.formRegistro.getRawValue();
    await this.ejecutar(() => this.auth.registrar(nombre, email, password, telefono));
  }

  /** Ejecuta la acción, muestra errores y redirige si todo salió bien. */
  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.error.set('');
    this.cargando.set(true);
    try {
      await accion();
      const volver = this.ruta.snapshot.queryParamMap.get('volver') ?? '/mascotas';
      this.router.navigateByUrl(volver);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
}
