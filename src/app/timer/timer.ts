import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-timer',
  styleUrl: './timer.scss',
  templateUrl: './timer.html',
})
export class Timer implements OnDestroy {
  readonly presets = [15, 25, 45, 60];
  readonly duration = signal(25 * 60);
  readonly remainingSeconds = signal(25 * 60);
  readonly running = signal(false);

  private timerHandle: number | null = null;

  ngOnDestroy(): void {
    this.stop();
  }

  setPreset(minutes: number): void {
    this.stop();
    const totalSeconds = minutes * 60;
    this.duration.set(totalSeconds);
    this.remainingSeconds.set(totalSeconds);
  }

  start(): void {
    if (this.running() || this.remainingSeconds() <= 0) {
      return;
    }

    this.running.set(true);
    this.timerHandle = window.setInterval(() => {
      this.remainingSeconds.update((value) => {
        if (value <= 1) {
          this.stop();
          return 0;
        }

        return value - 1;
      });
    }, 1000);
  }

  pause(): void {
    this.stop();
  }

  reset(): void {
    this.stop();
    this.remainingSeconds.set(this.duration());
  }

  get formattedTime(): string {
    const totalSeconds = this.remainingSeconds();
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private stop(): void {
    this.running.set(false);
    if (this.timerHandle !== null) {
      window.clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
