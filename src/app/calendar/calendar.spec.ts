import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Calendar } from './calendar';

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [Calendar] }).compileComponents();
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
});
