import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from '../exercises/exercise.service';
import { Routine } from './routine';

@Component({
  imports: [],
  selector: 'app-routine-detail',
  templateUrl: './routine-detail.html',
})
export class RoutineDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly routine = signal<Routine | null>(null);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    const email = this.auth.currentUser()?.email;
    const id = this.route.snapshot.paramMap.get('id');
    if (!email || !id || !isPlatformBrowser(this.platformId)) {
      this.errorMessage.set('No se encontró la rutina solicitada.');
      return;
    }

    try {
      const raw = window.localStorage.getItem(`fittrack.routines.${email}`);
      const parsed: unknown = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.errorMessage.set('Los datos de rutinas guardados no son válidos.');
        return;
      }

      const match = parsed.find(
        (value): value is Routine =>
          typeof value === 'object' &&
          value !== null &&
          'id' in value &&
          value.id === id &&
          'name' in value &&
          typeof value.name === 'string' &&
          'dayOfWeek' in value &&
          typeof value.dayOfWeek === 'string' &&
          'exerciseIds' in value &&
          Array.isArray(value.exerciseIds) &&
          value.exerciseIds.every((exerciseId: unknown) => typeof exerciseId === 'string'),
      );
      if (!match) {
        this.errorMessage.set('No se encontró la rutina solicitada.');
        return;
      }
      this.routine.set(match);
    } catch (error) {
      if (error instanceof DOMException || error instanceof SyntaxError) {
        this.errorMessage.set('No se pudieron leer las rutinas guardadas en este dispositivo.');
        return;
      }
      throw error;
    }
  }

  getExercise(exerciseId: string) {
    return this.exerciseService.exercises().find(({ id }) => id === exerciseId) ?? null;
  }
}
