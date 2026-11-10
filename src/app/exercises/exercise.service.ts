import { isPlatformBrowser } from '@angular/common';
import { effect, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Exercise, ExerciseInput } from './exercise';

type ExerciseResult =
  | { success: true }
  | { success: false; reason: 'storage-unavailable' | 'not-found' };
type RoutineReferenceResult =
  | { success: true; routineNames: string[] }
  | { success: false; reason: 'storage-unavailable' };

const STORAGE_PREFIX = 'fittrack.exercises.';
const ROUTINE_STORAGE_PREFIX = 'fittrack.routines.';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  readonly storageUnavailable = signal(false);
  private readonly state = signal<Exercise[]>([]);
  private loadedUserEmail: string | null = null;
  readonly exercises = this.state.asReadonly();

  constructor() {
    effect(() => {
      const email = this.auth.currentUser()?.email ?? null;
      if (email === this.loadedUserEmail) {
        return;
      }

      this.loadedUserEmail = email;
      this.storageUnavailable.set(false);
      this.state.set(email ? this.read(email) : []);
    });
  }

  add(input: ExerciseInput): ExerciseResult {
    const userEmail = this.auth.currentUser()?.email;
    if (!isPlatformBrowser(this.platformId) || !userEmail || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    const next = [...this.state(), { ...input, id: crypto.randomUUID() }];
    return this.save(userEmail, next);
  }

  update(id: string, input: ExerciseInput): ExerciseResult {
    const userEmail = this.auth.currentUser()?.email;
    if (!isPlatformBrowser(this.platformId) || !userEmail || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    if (!this.state().some((exercise) => exercise.id === id)) {
      return { success: false, reason: 'not-found' };
    }

    return this.save(
      userEmail,
      this.state().map((exercise) => (exercise.id === id ? { ...input, id } : exercise)),
    );
  }

  remove(id: string): ExerciseResult {
    const userEmail = this.auth.currentUser()?.email;
    if (!isPlatformBrowser(this.platformId) || !userEmail || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    if (!this.state().some((exercise) => exercise.id === id)) {
      return { success: false, reason: 'not-found' };
    }

    return this.save(userEmail, this.state().filter((exercise) => exercise.id !== id));
  }

  getRoutineNamesUsing(exerciseId: string): RoutineReferenceResult {
    const userEmail = this.auth.currentUser()?.email;
    if (!isPlatformBrowser(this.platformId) || !userEmail || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    try {
      const raw = window.localStorage.getItem(`${ROUTINE_STORAGE_PREFIX}${userEmail}`);
      if (raw === null) {
        return { success: true, routineNames: [] };
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every((routine) => this.isRoutine(routine))) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }

      return {
        success: true,
        routineNames: parsed
          .filter(({ exerciseIds }) => exerciseIds.includes(exerciseId))
          .map(({ name }) => name),
      };
    } catch (error) {
      if (error instanceof DOMException || error instanceof SyntaxError) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }
      throw error;
    }
  }

  private save(userEmail: string, exercises: Exercise[]): ExerciseResult {
    try {
      window.localStorage.setItem(this.storageKey(userEmail), JSON.stringify(exercises));
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
      this.storageUnavailable.set(true);
      return { success: false, reason: 'storage-unavailable' };
    }

    this.storageUnavailable.set(false);
    this.state.set(exercises);
    return { success: true };
  }

  private read(userEmail: string): Exercise[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey(userEmail));
      if (raw === null) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every((item) => this.isExercise(item))) {
        this.storageUnavailable.set(true);
        return [];
      }
      return parsed;
    } catch (error) {
      if (error instanceof DOMException || error instanceof SyntaxError) {
        this.storageUnavailable.set(true);
        return [];
      }
      throw error;
    }
  }

  private storageKey(userEmail: string): string {
    return `${STORAGE_PREFIX}${userEmail}`;
  }

  private isExercise(value: unknown): value is Exercise {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const item = value as Record<string, unknown>;
    return (
      typeof item['id'] === 'string' &&
      typeof item['name'] === 'string' &&
      typeof item['muscleGroup'] === 'string' &&
      typeof item['sets'] === 'number' &&
      typeof item['reps'] === 'number' &&
      (typeof item['weightKg'] === 'number' || item['weightKg'] === null) &&
      typeof item['notes'] === 'string'
    );
  }

  private isRoutine(
    value: unknown,
  ): value is { id: string; name: string; dayOfWeek: string; exerciseIds: string[] } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const routine = value as Record<string, unknown>;
    return (
      typeof routine['id'] === 'string' &&
      typeof routine['name'] === 'string' &&
      typeof routine['dayOfWeek'] === 'string' &&
      Array.isArray(routine['exerciseIds']) &&
      routine['exerciseIds'].every((id: unknown) => typeof id === 'string')
    );
  }
}
