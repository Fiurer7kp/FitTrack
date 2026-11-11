import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from '../exercises/exercise.service';
import { Exercise } from '../exercises/exercise';
import { Routines } from './routines';

describe('Routines', () => {
  let component: Routines;
  let fixture: ComponentFixture<Routines>;
  const currentUser = signal({ name: 'Ana', email: 'ana@example.com' });
  const exercises = signal<Exercise[]>([
    {
      id: 'exercise-1',
      name: 'Press de banca',
      muscleGroup: 'Pecho',
      sets: 4,
      reps: 8,
      weightKg: 50,
      notes: '',
    },
  ]);

  beforeEach(async () => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    currentUser.set({ name: 'Ana', email: 'ana@example.com' });
    await TestBed.configureTestingModule({
      imports: [Routines],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { currentUser } },
        { provide: ExerciseService, useValue: { exercises } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Routines);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires at least one exercise and saves a routine by day', () => {
    component.form.setValue({ name: 'Empuje', dayOfWeek: 'Lunes', exerciseIds: [] });
    component.saveRoutine();

    expect(component.errorMessage()).toContain('al menos un ejercicio');
    expect(component.routines()).toEqual([]);

    component.toggleExercise('exercise-1');
    component.saveRoutine();

    expect(component.routines()).toHaveLength(1);
    expect(component.routines()[0].dayOfWeek).toBe('Lunes');
    expect(component.routines()[0].exerciseIds).toEqual(['exercise-1']);
    expect(JSON.parse(window.localStorage.getItem('fittrack.routines.ana@example.com') ?? '[]')).toHaveLength(1);
  });

  it('edits a routine and confirms before deleting it', () => {
    component.form.setValue({ name: 'Empuje', dayOfWeek: 'Lunes', exerciseIds: ['exercise-1'] });
    component.saveRoutine();
    const routine = component.routines()[0];

    component.startEditing(routine);
    component.form.setValue({ name: 'Tren superior', dayOfWeek: 'Miércoles', exerciseIds: ['exercise-1'] });
    component.saveRoutine();
    expect(component.routines()[0].name).toBe('Tren superior');
    expect(component.routines()[0].dayOfWeek).toBe('Miércoles');

    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteRoutine(routine.id);
    expect(confirm).toHaveBeenCalledOnce();
    expect(component.routines()).toHaveLength(1);

    confirm.mockReturnValue(true);
    component.deleteRoutine(routine.id);
    expect(component.routines()).toEqual([]);
  });

  it('loads routines stored for the signed-in user and shows exercise counts', () => {
    window.localStorage.setItem(
      'fittrack.routines.ana@example.com',
      JSON.stringify([{ id: 'routine-1', name: 'Empuje', dayOfWeek: 'Lunes', exerciseIds: ['exercise-1'] }]),
    );
    fixture.destroy();
    fixture = TestBed.createComponent(Routines);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.routines()).toHaveLength(1);
    expect(component.getExerciseName(component.routines()[0].exerciseIds[0])).toBe('Press de banca');
    expect(fixture.nativeElement.textContent).toContain('1 ejercicio');
  });

  it('keeps previously saved routines that have no exercises available', () => {
    window.localStorage.setItem(
      'fittrack.routines.ana@example.com',
      JSON.stringify([{ id: 'routine-old', name: 'Rutina anterior', dayOfWeek: 'Martes', exerciseIds: [] }]),
    );
    fixture.destroy();
    fixture = TestBed.createComponent(Routines);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.routines()).toHaveLength(1);
    expect(component.errorMessage()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('0 ejercicios');
  });
});
