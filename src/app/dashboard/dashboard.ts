import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MetricCard } from '../metric-card/metric-card';
import {
  calculateWeeklyMetrics,
  createMockWorkouts,
  getProgressPoints,
  getRecentWorkouts,
  getWorkoutVolumeKg,
} from './workout';

@Component({
  imports: [MetricCard, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly weeklyGoal = 4;
  readonly workouts = createMockWorkouts();
  readonly metrics = calculateWeeklyMetrics(this.workouts, this.weeklyGoal);
  readonly recentWorkouts = getRecentWorkouts(this.workouts);
  readonly getWorkoutVolumeKg = getWorkoutVolumeKg;
  readonly progressRange = signal<30 | 90>(30);
  readonly progressPoints = computed(() => getProgressPoints(this.workouts, this.progressRange()));
  readonly chartPolyline = computed(() =>
    this.progressPoints().map(({ x, y }) => `${x},${y}`).join(' '),
  );
  readonly chartMaxWeight = computed(
    () => Math.ceil(Math.max(0, ...this.progressPoints().map(({ weightKg }) => weightKg)) / 10) * 10 || 10,
  );
  readonly chartTicks = computed(() => {
    const max = this.chartMaxWeight();
    return [0, Math.round(max / 2), max];
  });

  get userName(): string {
    return this.auth.currentUser()?.name ?? 'atleta';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  setProgressRange(range: 30 | 90): void {
    this.progressRange.set(range);
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}
