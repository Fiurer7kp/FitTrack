import { Component, computed } from '@angular/core';
import { createMockWorkouts } from '../dashboard/workout';

@Component({
  imports: [],
  selector: 'app-calendar',
  styleUrl: './calendar.scss',
  templateUrl: './calendar.html',
})
export class Calendar {
  readonly workouts = createMockWorkouts();

  readonly weekDays = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return {
        date,
        label: new Intl.DateTimeFormat('es', {
          weekday: 'short',
          day: 'numeric',
        }).format(date),
      };
    });
  });

  readonly dayCards = computed(() =>
    this.weekDays().map(({ date, label }) => ({
      date,
      label,
      items: this.workouts.filter((workout) => this.dateKey(workout.date) === this.dateKey(date)),
    })),
  );

  formatDay(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  private dateKey(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().slice(0, 10);
  }
}
