import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  mode = signal<'login' | 'register'>('login');
  errorMessage = signal<string | null>(this.auth.sessionNotice());

  form = this.fb.nonNullable.group({
    name: ['', [Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.auth.clearSessionNotice();
    const name = this.form.controls.name;
    name.setValidators(
      mode === 'register' ? [Validators.required, Validators.pattern(/\S/)] : [Validators.pattern(/\S/)],
    );
    name.updateValueAndValidity();
    this.form.markAsUntouched();
  }

  showError(field: 'name' | 'email' | 'password') {
    const c = this.form.controls[field];
    return c.invalid && c.touched;
  }

  async submit() {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    const isRegistering = this.mode() === 'register';
    const result = isRegistering
      ? await this.auth.register(name, email, password)
      : await this.auth.login(email, password);
    if (!result.success) {
      if (result.reason === 'email-in-use') {
        this.errorMessage.set('Ya existe una cuenta con ese correo.');
      } else if (result.reason === 'invalid-credentials') {
        this.errorMessage.set('El correo o la contraseña no son correctos.');
      } else if (result.reason === 'crypto-unavailable') {
        this.errorMessage.set('No se pudo verificar la contraseña. Inténtalo de nuevo.');
      } else {
        this.errorMessage.set('No se pudo acceder al almacenamiento de este dispositivo.');
      }
      return;
    }

    await this.router.navigate(['/dashboard']);
  }
}
