import { Component, OnDestroy, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { addWorkoutSession } from '../dashboard/workout';

@Component({
  imports: [],
  selector: 'app-timer',
  styleUrl: './timer.scss',
  templateUrl: './timer.html',
})
export class Timer implements OnDestroy {
  private readonly auth = inject(AuthService);
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

  saveSession(): void {
    const totalSeconds = this.stopwatchSeconds();
    if (totalSeconds <= 0) {
      return;
    }

    try {
      const workout = addWorkoutSession({
        name: this.sessionName().trim() || 'Entrenamiento',
        date: new Date(),
        durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
        caloriesBurned: 0,
        exercises: [],
      }, this.auth.currentUser()?.email ?? 'default');

      this.lastSavedSession.set(workout.name);
      this.sessionError.set(null);
      this.resetStopwatch();
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'No se pudo guardar la sesión. Inténtalo de nuevo.',
      );
    }
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
