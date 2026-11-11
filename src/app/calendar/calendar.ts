import { Component, computed, signal } from '@angular/core';
import { Workout, createMockWorkouts } from '../dashboard/workout';

interface CalendarDay {
  date: Date | null;
  workouts: Workout[];
  isToday: boolean;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

@Component({
  imports: [],
  selector: 'app-calendar',
  styleUrl: './calendar.scss',
  templateUrl: './calendar.html',
})
export class Calendar {
  readonly workouts = createMockWorkouts();
  readonly month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedDate = signal<Date | null>(null);
  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(this.month()),
  );
  readonly days = computed(() => {
    const month = this.month();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: totalCells }, (_, index): CalendarDay => {
      const dayNumber = index - mondayOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { date: null, workouts: [], isToday: false };
      }

      const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
      return {
        date,
        workouts: this.workouts.filter(({ date: workoutDate }) => localDateKey(workoutDate) === localDateKey(date)),
        isToday: localDateKey(date) === localDateKey(today),
      };
    });
  });
  readonly selectedWorkouts = computed(() => {
    const selected = this.selectedDate();
    return selected
      ? this.workouts.filter(({ date }) => localDateKey(date) === localDateKey(selected))
      : [];
  });

  previousMonth(): void {
    const current = this.month();
    this.month.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.selectedDate.set(null);
  }

  nextMonth(): void {
    const current = this.month();
    this.month.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.selectedDate.set(null);
  }

  selectDay(date: Date | null): void {
    if (date) {
      this.selectedDate.set(date);
    }
  }

  formatDay(date: Date): string {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(date);
  }

  isSelected(date: Date | null): boolean {
    const selected = this.selectedDate();
    return date !== null && selected !== null && localDateKey(date) === localDateKey(selected);
  }

  closeDayDetails(): void {
    this.selectedDate.set(null);
  }
}
