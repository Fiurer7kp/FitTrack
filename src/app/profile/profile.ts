import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { calculateWeeklyMetrics, createMockWorkouts, getWorkoutVolumeKg } from '../dashboard/workout';

const demoWorkouts = createMockWorkouts();

function getBestStreakDays(): number {
  const days = [...new Set(demoWorkouts.map(({ date }) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ))].sort((first, second) => first - second);
  let best = 0;
  let current = 0;
  let previous: number | null = null;

  for (const day of days) {
    current = previous !== null && day - previous === 86_400_000 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day;
  }

  return best;
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly user = this.auth.currentUser;

  readonly editing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly workouts = demoWorkouts;
  readonly stats = computed(() => ({
    totalWorkouts: this.workouts.length,
    bestStreak: getBestStreakDays(),
    totalVolumeKg: this.workouts.reduce((total, workout) => total + getWorkoutVolumeKg(workout), 0),
    weeklyMetrics: calculateWeeklyMetrics(this.workouts, 4),
  }));
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    weightKg: ['', [Validators.pattern(/^(?:\d+(?:\.\d+)?|\.\d+)$/), Validators.min(0.1)]],
    heightCm: ['', [Validators.pattern(/^(?:\d+(?:\.\d+)?|\.\d+)$/), Validators.min(0.1)]],
    goal: [''],
  });

  constructor() {
    this.resetForm();
  }

  get userName(): string {
    return this.user()?.name ?? 'Atleta';
  }

  get userEmail(): string {
    return this.user()?.email ?? '';
  }

  get weightKg(): number | null {
    return this.user()?.weightKg ?? null;
  }

  get heightCm(): number | null {
    return this.user()?.heightCm ?? null;
  }

  get goal(): string {
    return this.user()?.goal ?? '';
  }

  startEditing(): void {
    this.resetForm();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.resetForm();
    this.editing.set(false);
    this.errorMessage.set(null);
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const result = this.auth.updateProfile({
      name: values.name.trim(),
      weightKg: values.weightKg ? Number(values.weightKg) : null,
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      goal: values.goal.trim(),
    });

    if (!result.success) {
      this.errorMessage.set(
        result.reason === 'unauthenticated'
          ? 'Tu sesión terminó. Vuelve a iniciar sesión para editar el perfil.'
          : 'No se pudo guardar el perfil en este dispositivo.',
      );
      return;
    }

    this.editing.set(false);
    this.errorMessage.set(null);
    this.successMessage.set('Perfil actualizado.');
  }

  private resetForm(): void {
    const user = this.user();
    this.form.reset({
      name: user?.name ?? '',
      weightKg: user?.weightKg == null ? '' : String(user.weightKg),
      heightCm: user?.heightCm == null ? '' : String(user.heightCm),
      goal: user?.goal ?? '',
    });
  }
}
