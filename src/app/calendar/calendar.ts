import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import {
  Workout,
  getStoredWorkouts,
  removeWorkoutSession,
  updateWorkoutSession,
} from '../dashboard/workout';

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
  private readonly auth = inject(AuthService);
  readonly sessionError = signal<string | null>(null);
  readonly workouts = signal(this.loadWorkouts());
  readonly month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly selectedDate = signal<Date | null>(null);
  readonly editingWorkoutId = signal<string | null>(null);
  readonly editName = signal('');
  readonly editDate = signal('');
  readonly editDuration = signal('');
  readonly editCalories = signal('');
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
        workouts: this.workouts().filter(({ date: workoutDate }) => localDateKey(workoutDate) === localDateKey(date)),
        isToday: localDateKey(date) === localDateKey(today),
      };
    });
  });
  readonly selectedWorkouts = computed(() => {
    const selected = this.selectedDate();
    return selected
      ? this.workouts().filter(({ date }) => localDateKey(date) === localDateKey(selected))
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
    this.cancelEdit();
  }

  startEdit(workout: Workout): void {
    this.editingWorkoutId.set(workout.id);
    this.editName.set(workout.name);
    this.editDate.set(this.toDateInput(workout.date));
    this.editDuration.set(String(workout.durationMinutes));
    this.editCalories.set(String(workout.caloriesBurned));
    this.sessionError.set(null);
  }

  updateEditField(field: 'name' | 'date' | 'duration' | 'calories', event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const value = event.target.value;
    if (field === 'name') this.editName.set(value);
    if (field === 'date') this.editDate.set(value);
    if (field === 'duration') this.editDuration.set(value);
    if (field === 'calories') this.editCalories.set(value);
  }

  saveEdit(): void {
    const id = this.editingWorkoutId();
    if (!id) {
      return;
    }

    try {
      const date = new Date(`${this.editDate()}T12:00:00`);
      const updated = updateWorkoutSession(id, {
        name: this.editName(),
        date,
        durationMinutes: Number(this.editDuration()),
        caloriesBurned: Number(this.editCalories()),
      }, this.auth.currentUser()?.email ?? 'default');
      this.workouts.update((workouts) =>
        workouts.map((workout) => (workout.id === id ? updated : workout)),
      );
      this.month.set(new Date(date.getFullYear(), date.getMonth(), 1));
      this.selectedDate.set(date);
      this.cancelEdit();
      this.sessionError.set(null);
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'No se pudo guardar la sesión. Inténtalo de nuevo.',
      );
    }
  }

  deleteWorkout(workout: Workout): void {
    if (!window.confirm(`¿Eliminar la sesión "${workout.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      this.workouts.set(
        removeWorkoutSession(workout.id, this.auth.currentUser()?.email ?? 'default'),
      );
      this.cancelEdit();
      this.sessionError.set(null);
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'No se pudo eliminar la sesión. Inténtalo de nuevo.',
      );
    }
  }

  cancelEdit(): void {
    this.editingWorkoutId.set(null);
  }

  private loadWorkouts(): Workout[] {
    try {
      return getStoredWorkouts(new Date(), this.auth.currentUser()?.email ?? 'default');
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'No se pudieron cargar las sesiones guardadas.',
      );
      return [];
    }
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
