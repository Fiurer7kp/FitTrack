import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { calculateWeeklyMetrics, createMockWorkouts } from '../dashboard/workout';

@Component({
  imports: [],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  private readonly auth = inject(AuthService);

  readonly stats = computed(() => {
    const workouts = createMockWorkouts();
    return {
      workouts: workouts.length,
      metrics: calculateWeeklyMetrics(workouts, 4),
    };
  });

  get userName(): string {
    return this.auth.currentUser()?.name ?? 'Atleta';
  }

  get userEmail(): string {
    return this.auth.currentUser()?.email ?? 'sin-email@fittrack.com';
  }
}
