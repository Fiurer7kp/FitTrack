import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // 'login' o 'register': controla la pestaña activa
  mode = signal<'login' | 'register'>('login');

  form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    // El nombre solo es obligatorio al registrarse
    const name = this.form.controls.name;
    name.setValidators(mode === 'register' ? [Validators.required] : []);
    name.updateValueAndValidity();
    this.form.markAsUntouched();
  }

  // true si el campo es inválido y el usuario ya lo tocó
  showError(field: 'name' | 'email' | 'password') {
    const c = this.form.controls[field];
    return c.invalid && c.touched;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // muestra todos los errores a la vez
      return;
    }
    // Login simulado: todavía no hay backend
    this.router.navigate(['/dashboard']);
  }
}
