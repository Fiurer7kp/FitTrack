import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from '../exercises/exercise.service';
import { Routine } from './routine';

const ROUTINE_STORAGE_PREFIX = 'fittrack.routines.';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-routines',
  styleUrl: './routines.scss',
  templateUrl: './routines.html',
})
export class Routines {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly routines = signal<Routine[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly editingRoutineId = signal<string | null>(null);
  readonly availableExercises = this.exerciseService.exercises;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2)]],
    dayOfWeek: ['Lunes', Validators.required],
    exerciseIds: [[] as string[]],
  });

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email ?? null;
      this.errorMessage.set(null);
      if (!email || !isPlatformBrowser(this.platformId)) {
        this.routines.set([]);
        return;
      }

      this.routines.set(this.readRoutines(email));
    });
  }

  toggleExercise(exerciseId: string): void {
    const selected = this.form.controls.exerciseIds.value;
    this.form.controls.exerciseIds.setValue(
      selected.includes(exerciseId)
        ? selected.filter((id) => id !== exerciseId)
        : [...selected, exerciseId],
    );
  }

  startEditing(routine: Routine): void {
    this.editingRoutineId.set(routine.id);
    this.form.reset({
      name: routine.name,
      dayOfWeek: routine.dayOfWeek,
      exerciseIds: [...routine.exerciseIds],
    });
    this.errorMessage.set(null);
  }

  cancelEditing(): void {
    this.editingRoutineId.set(null);
    this.form.reset({ name: '', dayOfWeek: 'Lunes', exerciseIds: [] });
    this.errorMessage.set(null);
  }

  saveRoutine(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, dayOfWeek, exerciseIds } = this.form.getRawValue();
    if (exerciseIds.length === 0) {
      this.errorMessage.set('Selecciona al menos un ejercicio para la rutina.');
      return;
    }

    const userEmail = this.auth.currentUser()?.email;
    if (!userEmail) {
      this.errorMessage.set('Tu sesión terminó. Vuelve a iniciar sesión para guardar la rutina.');
      return;
    }

    const editingId = this.editingRoutineId();
    const nextRoutine: Routine = {
      id: editingId ?? crypto.randomUUID(),
      name: name.trim(),
      dayOfWeek,
      exerciseIds,
    };
    const next = editingId
      ? this.routines().map((routine) => (routine.id === editingId ? nextRoutine : routine))
      : [...this.routines(), nextRoutine];

    if (this.persistRoutines(userEmail, next)) {
      this.routines.set(next);
      this.cancelEditing();
    }
  }

  deleteRoutine(routineId: string): void {
    const routine = this.routines().find(({ id }) => id === routineId);
    if (!routine || !window.confirm(`¿Eliminar la rutina "${routine.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const userEmail = this.auth.currentUser()?.email;
    if (!userEmail) {
      this.errorMessage.set('Tu sesión terminó. Vuelve a iniciar sesión para eliminar la rutina.');
      return;
    }

    const next = this.routines().filter(({ id }) => id !== routineId);
    if (this.persistRoutines(userEmail, next)) {
      this.routines.set(next);
      this.errorMessage.set(null);
    }
  }

  getExerciseName(exerciseId: string): string {
    return this.availableExercises().find(({ id }) => id === exerciseId)?.name ?? 'Ejercicio eliminado';
  }

  private readRoutines(email: string): Routine[] {
    try {
      const raw = window.localStorage.getItem(`${ROUTINE_STORAGE_PREFIX}${email}`);
      if (raw === null) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every((routine) => this.isRoutine(routine))) {
        this.errorMessage.set('Los datos de rutinas guardados no son válidos. No se modificaron.');
        return [];
      }
      return parsed;
    } catch (error) {
      if (error instanceof DOMException || error instanceof SyntaxError) {
        this.errorMessage.set('No se pudieron leer las rutinas guardadas en este dispositivo.');
        return [];
      }
      throw error;
    }
  }

  private persistRoutines(email: string, routines: Routine[]): boolean {
    try {
      window.localStorage.setItem(`${ROUTINE_STORAGE_PREFIX}${email}`, JSON.stringify(routines));
      this.errorMessage.set(null);
      return true;
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
      this.errorMessage.set('No se pudo guardar el cambio. Revisa el almacenamiento e inténtalo de nuevo.');
      return false;
    }
  }

  private isRoutine(value: unknown): value is Routine {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const item = value as Record<string, unknown>;
    return (
      typeof item['id'] === 'string' &&
      typeof item['name'] === 'string' &&
      typeof item['dayOfWeek'] === 'string' &&
      this.dayOptions.includes(item['dayOfWeek']) &&
      Array.isArray(item['exerciseIds']) &&
      item['exerciseIds'].every((id: unknown) => typeof id === 'string')
    );
  }
}
