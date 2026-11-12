import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { WorkoutExercise, WorkoutSet, addWorkoutSession } from '../dashboard/workout';
import { Exercise } from '../exercises/exercise';
import { ExerciseService } from '../exercises/exercise.service';

interface SetDraft extends WorkoutSet {
  id: string;
}

interface ExerciseDraft {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetDraft[];
}

@Component({
  imports: [RouterLink],
  selector: 'app-timer',
  styleUrl: './timer.scss',
  templateUrl: './timer.html',
})
export class Timer implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly exerciseService = inject(ExerciseService);
  private nextDraftId = 0;

  readonly restPresets = [30, 60, 90, 120];
  readonly stopwatchSeconds = signal(0);
  readonly stopwatchRunning = signal(false);
  readonly restDurationSeconds = signal(60);
  readonly restRemainingSeconds = signal(60);
  readonly restRunning = signal(false);
  readonly restFinished = signal(false);
  readonly customRestInput = signal('60');
  readonly sessionName = signal('Entrenamiento');
  readonly lastSavedSession = signal<string | null>(null);
  readonly sessionError = signal<string | null>(null);
  readonly availableExercises = this.exerciseService.exercises;
  readonly selectedExerciseId = signal('');
  readonly exerciseDrafts = signal<ExerciseDraft[]>([]);

  private stopwatchHandle: number | null = null;
  private restHandle: number | null = null;

  ngOnDestroy(): void {
    this.stopStopwatch();
    this.stopRest();
  }

  startStopwatch(): void {
    if (this.stopwatchRunning()) {
      return;
    }

    this.stopwatchRunning.set(true);
    this.stopwatchHandle = window.setInterval(() => {
      this.stopwatchSeconds.update((seconds) => seconds + 1);
    }, 1000);
  }

  pauseStopwatch(): void {
    this.stopStopwatch();
  }

  resetStopwatch(): void {
    this.stopStopwatch();
    this.stopwatchSeconds.set(0);
  }

  setRestPreset(seconds: number): void {
    this.stopRest();
    this.restFinished.set(false);
    this.restDurationSeconds.set(seconds);
    this.restRemainingSeconds.set(seconds);
    this.customRestInput.set(String(seconds));
  }

  updateCustomRestInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.customRestInput.set(event.target.value);
    }
  }

  updateSessionName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.sessionName.set(event.target.value);
    }
  }

  updateSelectedExercise(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.selectedExerciseId.set(event.target.value);
    }
  }

  addExercise(): void {
    const exercise = this.availableExercises().find(({ id }) => id === this.selectedExerciseId());
    if (!exercise) {
      this.sessionError.set('Selecciona un ejercicio válido de tu biblioteca.');
      return;
    }
    if (this.exerciseDrafts().some(({ exerciseId }) => exerciseId === exercise.id)) {
      this.sessionError.set('Ese ejercicio ya está agregado a esta sesión.');
      return;
    }

    this.exerciseDrafts.update((drafts) => [...drafts, this.createExerciseDraft(exercise)]);
    this.selectedExerciseId.set('');
    this.sessionError.set(null);
  }

  addSet(exerciseId: string): void {
    this.exerciseDrafts.update((drafts) =>
      drafts.map((draft) =>
        draft.id === exerciseId
          ? {
              ...draft,
              sets: [
                ...draft.sets,
                this.createSetDraft(draft.sets.at(-1)?.reps ?? 8, draft.sets.at(-1)?.weightKg ?? 0),
              ],
            }
          : draft,
      ),
    );
  }

  removeSet(exerciseId: string, setId: string): void {
    this.exerciseDrafts.update((drafts) =>
      drafts.map((draft) =>
        draft.id === exerciseId && draft.sets.length > 1
          ? { ...draft, sets: draft.sets.filter(({ id }) => id !== setId) }
          : draft,
      ),
    );
  }

  updateSet(
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weightKg',
    event: Event,
  ): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const value = event.target.value === '' ? Number.NaN : Number(event.target.value);
    this.exerciseDrafts.update((drafts) =>
      drafts.map((draft) =>
        draft.id === exerciseId
          ? {
              ...draft,
              sets: draft.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : draft,
      ),
    );
  }

  removeExercise(exerciseId: string): void {
    this.exerciseDrafts.update((drafts) => drafts.filter(({ id }) => id !== exerciseId));
  }

  saveSession(): void {
    const totalSeconds = this.stopwatchSeconds();
    if (totalSeconds <= 0) {
      return;
    }

    try {
      const exercises = this.buildWorkoutExercises();
      if (!exercises) {
        return;
      }

      const workout = addWorkoutSession({
        name: this.sessionName().trim() || 'Entrenamiento',
        date: new Date(),
        durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
        caloriesBurned: 0,
        exercises,
      }, this.auth.currentUser()?.email ?? 'default');

      this.lastSavedSession.set(workout.name);
      this.sessionError.set(null);
      this.exerciseDrafts.set([]);
      this.selectedExerciseId.set('');
      this.resetStopwatch();
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'No se pudo guardar la sesión. Inténtalo de nuevo.',
      );
    }
  }

  private buildWorkoutExercises(): WorkoutExercise[] | null {
    const drafts = this.exerciseDrafts();
    const exercises: WorkoutExercise[] = [];

    for (const draft of drafts) {
      if (draft.sets.length === 0) {
        this.sessionError.set(`Agrega al menos una serie a ${draft.name}.`);
        return null;
      }

      const invalidSet = draft.sets.some(
        ({ reps, weightKg }) =>
          !Number.isInteger(reps) || reps < 1 || !Number.isFinite(weightKg) || weightKg < 0,
      );
      if (invalidSet) {
        this.sessionError.set(`Revisa las repeticiones y el peso de ${draft.name}.`);
        return null;
      }

      const setDetails = draft.sets.map(({ reps, weightKg }) => ({ reps, weightKg }));
      exercises.push({
        name: draft.name,
        exerciseId: draft.exerciseId,
        sets: setDetails.length,
        reps: Math.round(setDetails.reduce((total, { reps }) => total + reps, 0) / setDetails.length),
        weightKg: Math.max(...setDetails.map(({ weightKg }) => weightKg)),
        setDetails,
      });
    }

    return exercises;
  }

  private createExerciseDraft(exercise: Exercise): ExerciseDraft {
    return {
      id: this.createDraftId(),
      exerciseId: exercise.id,
      name: exercise.name,
      sets: Array.from({ length: Math.max(1, exercise.sets) }, () =>
        this.createSetDraft(exercise.reps, exercise.weightKg ?? 0),
      ),
    };
  }

  private createSetDraft(reps: number, weightKg: number): SetDraft {
    return { id: this.createDraftId(), reps, weightKg };
  }

  private createDraftId(): string {
    this.nextDraftId += 1;
    return `draft-${this.nextDraftId}`;
  }

  applyCustomRest(): void {
    const seconds = Number(this.customRestInput());
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) {
      return;
    }

    this.setRestPreset(seconds);
  }

  startRest(): void {
    if (this.restRunning() || this.restRemainingSeconds() <= 0) {
      return;
    }

    this.restFinished.set(false);
    this.restRunning.set(true);
    this.restHandle = window.setInterval(() => {
      this.restRemainingSeconds.update((seconds) => {
        if (seconds <= 1) {
          this.stopRest();
          this.restFinished.set(true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);
  }

  pauseRest(): void {
    this.stopRest();
  }

  resetRest(): void {
    this.stopRest();
    this.restFinished.set(false);
    this.restRemainingSeconds.set(this.restDurationSeconds());
  }

  formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  get stopwatchTime(): string {
    return this.formatTime(this.stopwatchSeconds());
  }

  get restTime(): string {
    return this.formatTime(this.restRemainingSeconds());
  }

  private stopStopwatch(): void {
    this.stopwatchRunning.set(false);
    if (this.stopwatchHandle !== null) {
      window.clearInterval(this.stopwatchHandle);
      this.stopwatchHandle = null;
    }
  }

  private stopRest(): void {
    this.restRunning.set(false);
    if (this.restHandle !== null) {
      window.clearInterval(this.restHandle);
      this.restHandle = null;
    }
  }
}
