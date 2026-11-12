import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { getScheduledRoutines } from '../routines/routine';
import { Calendar } from './calendar';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  const currentUser = signal({ name: 'Ana', email: 'ana@example.com' });

  beforeEach(async () => {
    localStorage.clear();
    currentUser.set({ name: 'Ana', email: 'ana@example.com' });
    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders a monthly calendar and changes months', () => {
    const originalMonth = component.month();
    expect(component.days().filter(({ date }) => date !== null).length).toBe(
      new Date(originalMonth.getFullYear(), originalMonth.getMonth() + 1, 0).getDate(),
    );

    component.previousMonth();
    expect(component.month().getMonth()).toBe((originalMonth.getMonth() + 11) % 12);
    component.nextMonth();
    expect(component.month().getMonth()).toBe(originalMonth.getMonth());
  });

  it('shows the selected day training or an empty-day message', () => {
    const today = new Date();
    const sessionDay = component.days().find(({ workouts }) => workouts.length > 0);
    expect(sessionDay?.date).not.toBeNull();
    component.selectDay(sessionDay?.date ?? null);
    fixture.detectChanges();

    expect(component.selectedWorkouts().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Detalle del día');

    component.selectDay(today);
    const todayWorkouts = component.workouts().filter(
      ({ date }) =>
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate(),
    );
    if (todayWorkouts.length === 0) {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay entrenamientos registrados este día.');
    }
  });

  it('edits and deletes a session from its selected day', () => {
    const session = component.workouts()[0];
    component.selectDay(session.date);
    component.startEdit(session);
    component.editName.set('Sesión editada');
    component.editDate.set('2026-11-12');
    component.editDuration.set('42');
    component.editCalories.set('250');
    component.saveEdit();

    expect(component.workouts().find(({ id }) => id === session.id)).toMatchObject({
      name: 'Sesión editada',
      durationMinutes: 42,
      caloriesBurned: 250,
    });
    expect(component.editingWorkoutId()).toBeNull();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const editedSession = component.workouts().find(({ id }) => id === session.id);
    expect(editedSession).toBeDefined();
    if (!editedSession) {
      throw new Error('La sesión editada debería seguir en el historial.');
    }
    component.deleteWorkout(editedSession);

    expect(component.workouts().some(({ id }) => id === session.id)).toBe(false);
  });

  it('shows the recorded weight and repetitions for each exercise set', () => {
    const session = {
      ...component.workouts()[0],
      exercises: [{
        name: 'Press de banca',
        sets: 1,
        reps: 6,
        weightKg: 65,
        setDetails: [{ reps: 6, weightKg: 65 }],
      }],
    };
    component.workouts.set([session]);
    component.selectDay(session.date);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Serie 1: 6 rep × 65 kg');
  });

  it('plans a routine on a selected date and prevents duplicate plans', () => {
    const routine = {
      id: 'routine-push',
      name: 'Día de empuje',
      dayOfWeek: 'Lunes',
      exerciseIds: ['bench-press'],
    };
    localStorage.setItem('fittrack.routines.ana@example.com', JSON.stringify([routine]));
    const date = new Date(2026, 10, 20);
    component.selectDay(date);
    component.availableRoutines.set([routine]);
    component.selectedRoutineId.set(routine.id);
    component.scheduleSelectedRoutine();

    expect(component.selectedScheduledRoutines()).toMatchObject([
      { routineId: routine.id, routineName: routine.name, date: '2026-11-20' },
    ]);
    expect(getScheduledRoutines('other@example.com')).toEqual([]);

    component.selectedRoutineId.set(routine.id);
    component.scheduleSelectedRoutine();
    expect(component.planningError()).toContain('ya está planificada');
    expect(component.scheduledRoutines()).toHaveLength(1);
  });

  it('removes a planned routine from the calendar', () => {
    const routine = {
      id: 'routine-pull',
      name: 'Día de tirón',
      dayOfWeek: 'Martes',
      exerciseIds: ['row'],
    };
    component.selectDay(new Date(2026, 10, 21));
    component.availableRoutines.set([routine]);
    component.selectedRoutineId.set(routine.id);
    component.scheduleSelectedRoutine();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const [planned] = component.selectedScheduledRoutines();
    expect(planned).toBeDefined();
    if (!planned) {
      throw new Error('La rutina debería estar planificada.');
    }
    component.deleteScheduledRoutine(planned);

    expect(component.selectedScheduledRoutines()).toEqual([]);
  });
});
