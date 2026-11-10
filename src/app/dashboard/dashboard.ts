import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MetricCard } from '../metric-card/metric-card';
import {
  calculateWeeklyMetrics,
  createMockWorkouts,
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

  get userName(): string {
    return this.auth.currentUser()?.name ?? 'atleta';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}
