import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { calculateWeeklyMetrics, createMockWorkouts, getWorkoutVolumeKg } from '../dashboard/workout';
import { addBodyMeasurement, BodyMeasurement, getBodyMeasurements } from './body-measurement';

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
  readonly bodyMeasurementError = signal<string | null>(null);
  readonly bodyMeasurementSuccess = signal<string | null>(null);
  readonly workouts = demoWorkouts;
  readonly bodyMeasurements = signal(this.loadBodyMeasurements());
  readonly bodyMeasurementForm = this.fb.nonNullable.group({
    date: [this.localDateInput(), Validators.required],
    weightKg: ['', Validators.min(0.1)],
    waistCm: ['', Validators.min(0.1)],
  });
  readonly bodyMeasurementTrend = computed(() => ({
    weightKg: this.getMeasurementChange('weightKg'),
    waistCm: this.getMeasurementChange('waistCm'),
  }));
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

  saveBodyMeasurement(): void {
    if (this.bodyMeasurementForm.invalid) {
      this.bodyMeasurementForm.markAllAsTouched();
      return;
    }

    const accountEmail = this.user()?.email;
    if (!accountEmail) {
      this.bodyMeasurementError.set('Tu sesión terminó. Vuelve a iniciar sesión para guardar medidas.');
      return;
    }

    const values = this.bodyMeasurementForm.getRawValue();
    const weightKg = values.weightKg ? Number(values.weightKg) : null;
    const waistCm = values.waistCm ? Number(values.waistCm) : null;
    if (weightKg === null && waistCm === null) {
      this.bodyMeasurementError.set('Registra el peso, la cintura o ambas medidas.');
      return;
    }

    try {
      this.bodyMeasurements.set(
        addBodyMeasurement({ date: values.date, weightKg, waistCm }, accountEmail),
      );
      this.bodyMeasurementForm.reset({
        date: this.localDateInput(),
        weightKg: '',
        waistCm: '',
      });
      this.bodyMeasurementError.set(null);
      this.bodyMeasurementSuccess.set('Medidas guardadas en tu historial.');
    } catch (error) {
      this.bodyMeasurementError.set(
        error instanceof Error ? error.message : 'No se pudieron guardar las medidas.',
      );
      this.bodyMeasurementSuccess.set(null);
    }
  }

  formatMeasurementDate(date: string): string {
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
      new Date(`${date}T12:00:00`),
    );
  }

  private loadBodyMeasurements(): BodyMeasurement[] {
    const accountEmail = this.user()?.email;
    if (!accountEmail) {
      return [];
    }

    try {
      return getBodyMeasurements(accountEmail);
    } catch (error) {
      this.bodyMeasurementError.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las medidas guardadas.',
      );
      return [];
    }
  }

  private getMeasurementChange(field: 'weightKg' | 'waistCm'): number | null {
    const values = this.bodyMeasurements()
      .filter((entry) => entry[field] !== null)
      .map((entry) => entry[field])
      .filter((value): value is number => value !== null);
    if (values.length < 2) {
      return null;
    }

    return Math.round((values[0] - values[values.length - 1]) * 10) / 10;
  }

  private localDateInput(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
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
