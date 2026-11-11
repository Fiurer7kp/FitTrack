import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from '../exercises/exercise.service';

interface Routine {
  id: string;
  name: string;
  dayOfWeek: string;
  exerciseIds: string[];
}

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

  readonly dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  readonly routines = signal<Routine[]>([]);
  readonly availableExercises = computed(() => this.exerciseService.exercises());

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    dayOfWeek: ['Lunes', Validators.required],
    exerciseIds: [[] as string[]],
  });

  constructor() {
    effect(() => {
      const userEmail = this.auth.currentUser()?.email ?? null;
      if (!userEmail) {
        this.routines.set([]);
        return;
      }

      try {
        const raw = window.localStorage.getItem(`fittrack.routines.${userEmail}`);
        const parsed = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(parsed)
          ? parsed.filter(
              (item): item is Routine =>
                typeof item === 'object' &&
                item !== null &&
                typeof item.id === 'string' &&
                typeof item.name === 'string' &&
                typeof item.dayOfWeek === 'string' &&
                Array.isArray(item.exerciseIds),
            )
          : [];

        this.routines.set(next);
      } catch {
        this.routines.set([]);
      }
    });
  }

  toggleExercise(exerciseId: string): void {
    const selected = [...this.form.controls.exerciseIds.value];
    const next = selected.includes(exerciseId)
      ? selected.filter((value) => value !== exerciseId)
      : [...selected, exerciseId];

    this.form.controls.exerciseIds.setValue(next);
  }

  saveRoutine(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userEmail = this.auth.currentUser()?.email;
    if (!userEmail) {
      return;
    }

    const { name, dayOfWeek, exerciseIds } = this.form.getRawValue();
    const nextRoutine: Routine = {
      id: crypto.randomUUID(),
      name: name.trim(),
      dayOfWeek,
      exerciseIds,
    };
    const next = [...this.routines(), nextRoutine];
    window.localStorage.setItem(`fittrack.routines.${userEmail}`, JSON.stringify(next));
    this.routines.set(next);
    this.form.reset({ name: '', dayOfWeek: 'Lunes', exerciseIds: [] });
  }

  deleteRoutine(routineId: string): void {
    const userEmail = this.auth.currentUser()?.email;
    if (!userEmail) {
      return;
    }

    const next = this.routines().filter((routine) => routine.id !== routineId);
    window.localStorage.setItem(`fittrack.routines.${userEmail}`, JSON.stringify(next));
    this.routines.set(next);
  }

  getExerciseName(exerciseId: string): string {
    return this.availableExercises().find((exercise) => exercise.id === exerciseId)?.name ?? 'Ejercicio eliminado';
  }
}
