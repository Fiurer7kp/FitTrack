import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { getStoredWorkouts, getWorkoutVolumeKg } from '../dashboard/workout';
import { Exercise } from '../exercises/exercise';
import { ExerciseService } from '../exercises/exercise.service';
import { Timer } from './timer';

describe('Timer', () => {
  let component: Timer;
  let fixture: ComponentFixture<Timer>;
  const currentUser = signal({ name: 'Ana', email: 'default' });
  const availableExercises = signal<Exercise[]>([
    {
      id: 'bench-press',
      name: 'Press de banca',
      muscleGroup: 'Pecho',
      sets: 2,
      reps: 8,
      weightKg: 60,
      notes: '',
    },
  ]);

  beforeEach(async () => {
    localStorage.clear();
    currentUser.set({ name: 'Ana', email: 'default' });
    await TestBed.configureTestingModule({
      imports: [Timer],
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: ExerciseService, useValue: { exercises: availableExercises } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Timer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats the stopwatch with hours, minutes, and seconds', () => {
    component.stopwatchSeconds.set(3_661);

    expect(component.stopwatchTime).toBe('01:01:01');
  });

  it('starts, pauses, and resets the stopwatch', () => {
    vi.useFakeTimers();
    component.startStopwatch();
    vi.advanceTimersByTime(3_000);
    component.pauseStopwatch();
    vi.advanceTimersByTime(2_000);

    expect(component.stopwatchSeconds()).toBe(3);

    component.resetStopwatch();
    expect(component.stopwatchTime).toBe('00:00:00');
    expect(component.stopwatchRunning()).toBe(false);
  });

  it('applies configurable rest durations and notifies when the countdown ends', () => {
    vi.useFakeTimers();
    component.setRestPreset(2);
    component.startRest();
    vi.advanceTimersByTime(2_000);
    fixture.detectChanges();

    expect(component.restRemainingSeconds()).toBe(0);
    expect(component.restFinished()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('¡Descanso terminado!');
  });

  it('rejects invalid custom rest durations', () => {
    component.customRestInput.set('0');
    component.applyCustomRest();
    expect(component.restDurationSeconds()).toBe(60);

    component.customRestInput.set('3601');
    component.applyCustomRest();
    expect(component.restDurationSeconds()).toBe(60);
  });

  it('saves a completed stopwatch session and resets the timer', () => {
    component.stopwatchSeconds.set(90);
    component.sessionName.set('Empuje');
    component.saveSession();

    const saved = JSON.parse(localStorage.getItem('fittrack.workouts') ?? '[]') as Array<{
      name: string;
      durationMinutes: number;
      caloriesBurned: number;
    }>;
    const session = saved.find(({ name }) => name === 'Empuje');

    expect(session).toMatchObject({ durationMinutes: 2, caloriesBurned: 0 });
    expect(component.lastSavedSession()).toBe('Empuje');
    expect(component.stopwatchSeconds()).toBe(0);
  });

  it('records each exercise set and includes its exact volume in the saved session', () => {
    component.selectedExerciseId.set('bench-press');
    component.addExercise();
    component.stopwatchSeconds.set(120);
    component.sessionName.set('Pecho');

    component.saveSession();

    const session = getStoredWorkouts().find(({ name }) => name === 'Pecho');
    if (!session) {
      throw new Error('La sesión debería haberse guardado.');
    }

    expect(session.exercises[0].exerciseId).toBe('bench-press');
    expect(session.exercises[0].setDetails).toEqual([
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ]);
    expect(getWorkoutVolumeKg(session)).toBe(960);
    expect(component.exerciseDrafts()).toEqual([]);
  });

  it('does not save a session with invalid set repetitions', () => {
    component.selectedExerciseId.set('bench-press');
    component.addExercise();
    component.exerciseDrafts.update((drafts) =>
      drafts.map((draft) => ({
        ...draft,
        sets: draft.sets.map((set, index) => (index === 0 ? { ...set, reps: 0 } : set)),
      })),
    );
    component.stopwatchSeconds.set(60);

    component.saveSession();

    expect(component.sessionError()).toContain('Revisa las repeticiones');
    expect(localStorage.getItem('fittrack.workouts')).toBeNull();
  });
});
