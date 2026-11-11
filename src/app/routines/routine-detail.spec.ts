import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from '../exercises/exercise.service';
import { Exercise } from '../exercises/exercise';
import { RoutineDetail } from './routine-detail';

describe('RoutineDetail', () => {
  let fixture: ComponentFixture<RoutineDetail>;
  const exercises = signal<Exercise[]>([
    {
      id: 'exercise-1',
      name: 'Press de banca',
      muscleGroup: 'Pecho',
      sets: 4,
      reps: 8,
      weightKg: 50,
      notes: 'Controlar el descenso',
    },
  ]);
  const currentUser = signal({ name: 'Ana', email: 'ana@example.com' });
  let routineId = 'routine-1';

  beforeEach(async () => {
    window.localStorage.clear();
    routineId = 'routine-1';
    await TestBed.configureTestingModule({
      imports: [RoutineDetail],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { currentUser } },
        { provide: ExerciseService, useValue: { exercises } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? routineId : null } } },
        },
      ],
    }).compileComponents();
  });

  it('shows exercise sets, reps, weight, and notes for the selected routine', () => {
    window.localStorage.setItem(
      'fittrack.routines.ana@example.com',
      JSON.stringify([{ id: 'routine-1', name: 'Empuje', dayOfWeek: 'Lunes', exerciseIds: ['exercise-1'] }]),
    );
    fixture = TestBed.createComponent(RoutineDetail);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Empuje');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).toContain('8');
    expect(fixture.nativeElement.textContent).toContain('50 kg');
    expect(fixture.nativeElement.textContent).toContain('Controlar el descenso');
  });

  it('shows a clear message when the requested routine does not exist', () => {
    routineId = 'missing';
    window.localStorage.setItem('fittrack.routines.ana@example.com', '[]');
    fixture = TestBed.createComponent(RoutineDetail);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se encontró la rutina solicitada.');
  });
});
