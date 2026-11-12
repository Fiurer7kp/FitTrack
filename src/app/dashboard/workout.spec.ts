import {
  addWorkoutSession,
  calculateWeeklyMetrics,
  getPersonalRecords,
  getProgressPoints,
  getRecentWorkouts,
  getStoredWorkouts,
  getWorkoutVolumeKg,
  removeWorkoutSession,
  updateWorkoutSession,
  Workout,
} from './workout';

function workout(id: string, date: string, caloriesBurned = 300): Workout {
  return {
    id,
    name: id,
    date: new Date(`${date}T12:00:00`),
    durationMinutes: 45,
    caloriesBurned,
    exercises: [{ name: 'Press de banca', sets: 3, reps: 8, weightKg: 50 }],
  };
}

describe('dashboard workout calculations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates the current Monday-to-Sunday week and weekly goal progress', () => {
    const workouts = [
      workout('monday', '2026-11-09', 350),
      workout('tuesday', '2026-11-10', 400),
      workout('sunday', '2026-11-08', 280),
    ];

    expect(calculateWeeklyMetrics(workouts, 4, new Date('2026-11-10T18:00:00'))).toEqual({
      workoutCount: 2,
      caloriesBurned: 750,
      streakDays: 3,
      goalProgress: 50,
    });
  });

  it('starts a new weekly total on Monday and caps goal progress at 100%', () => {
    const workouts = [
      workout('sunday', '2026-11-08'),
      workout('monday', '2026-11-09'),
      workout('tuesday', '2026-11-10'),
      workout('wednesday', '2026-11-11'),
      workout('thursday', '2026-11-12'),
    ];

    expect(calculateWeeklyMetrics(workouts, 2, new Date('2026-11-09T08:00:00'))).toMatchObject({
      workoutCount: 1,
      streakDays: 2,
      goalProgress: 50,
    });
    expect(calculateWeeklyMetrics(workouts, 2, new Date('2026-11-13T08:00:00')).goalProgress).toBe(100);
  });

  it('returns five newest workouts and calculates their lifted volume', () => {
    const workouts = [
      workout('oldest', '2026-11-01'),
      workout('newest', '2026-11-10'),
      workout('fourth', '2026-11-07'),
      workout('third', '2026-11-08'),
      workout('second', '2026-11-09'),
      workout('fifth', '2026-11-06'),
    ];

    expect(getRecentWorkouts(workouts).map(({ id }) => id)).toEqual([
      'newest',
      'second',
      'third',
      'fourth',
      'fifth',
    ]);
    expect(getWorkoutVolumeKg(workouts[0])).toBe(1200);
  });

  it('filters progress data by the selected range and plots lifted weight by date', () => {
    const workouts = [
      workout('within-range', '2026-10-25'),
      workout('outside-range', '2026-10-01'),
      workout('future', '2026-11-12'),
    ];

    const points = getProgressPoints(workouts, 30, new Date('2026-11-10T18:00:00'));

    expect(points.map(({ id }) => id)).toEqual(['within-range']);
    expect(points[0].weightKg).toBe(50);
    expect(points[0].x).toBeGreaterThan(46);
    expect(points[0].x).toBeLessThan(584);
  });

  it('returns an empty series when the selected range contains no weighted workouts', () => {
    expect(getProgressPoints([], 90, new Date('2026-11-10T18:00:00'))).toEqual([]);
  });

  it('calculates personal records from logged sets, preferring the latest date on a tie', () => {
    const workouts: Workout[] = [
      {
        ...workout('bench-first', '2026-11-10'),
        exercises: [{
          name: 'Press de banca',
          sets: 2,
          reps: 8,
          weightKg: 70,
          setDetails: [{ reps: 8, weightKg: 70 }],
        }],
      },
      {
        ...workout('bench-latest', '2026-11-12'),
        exercises: [{
          name: 'press de banca',
          sets: 2,
          reps: 6,
          weightKg: 70,
          setDetails: [{ reps: 6, weightKg: 70 }],
        }],
      },
      workout('legacy-example', '2026-11-12'),
    ];

    expect(getPersonalRecords(workouts)).toEqual([
      {
        id: 'press de banca',
        exerciseName: 'press de banca',
        weightKg: 70,
        reps: 6,
        date: new Date('2026-11-12T12:00:00'),
      },
    ]);
  });

  it('falls back to demo data and then persists a real workout session', () => {
    const demoWorkouts = getStoredWorkouts(new Date('2026-11-10T12:00:00'));
    expect(demoWorkouts.length).toBeGreaterThan(0);

    const session = addWorkoutSession({
      name: 'Sesión real',
      date: new Date('2026-11-11T18:30:00'),
      durationMinutes: 45,
      caloriesBurned: 320,
      exercises: [{ name: 'Press de banca', sets: 4, reps: 8, weightKg: 60 }],
    });

    expect(session.name).toBe('Sesión real');
    expect(getStoredWorkouts().some(({ id }) => id === session.id)).toBe(true);

    const storedWorkouts = JSON.parse(localStorage.getItem('fittrack.workouts') ?? '[]') as Array<{ name: string }>;
    expect(storedWorkouts.some(({ name }) => name === 'Sesión real')).toBe(true);
  });

  it('updates and deletes sessions, including persisting an empty history', () => {
    const [session] = getStoredWorkouts(new Date('2026-11-10T12:00:00'));
    localStorage.setItem('fittrack.workouts', JSON.stringify([session]));

    const updated = updateWorkoutSession(session.id, {
      name: 'Sesión corregida',
      date: new Date('2026-11-11T12:00:00'),
      durationMinutes: 50,
      caloriesBurned: 200,
    });

    expect(updated.name).toBe('Sesión corregida');
    expect(getStoredWorkouts()).toEqual([updated]);
    expect(removeWorkoutSession(session.id)).toEqual([]);
    expect(getStoredWorkouts()).toEqual([]);
  });

  it('rejects invalid session updates without changing the saved history', () => {
    const session = addWorkoutSession({
      name: 'Sesión válida',
      date: new Date('2026-11-11T12:00:00'),
      durationMinutes: 40,
      caloriesBurned: 0,
      exercises: [],
    });

    expect(() =>
      updateWorkoutSession(session.id, {
        name: ' ',
        date: new Date('invalid'),
        durationMinutes: 0,
        caloriesBurned: -1,
      }),
    ).toThrow('Revisa el nombre, fecha, duración y calorías de la sesión.');
    expect(getStoredWorkouts().some(({ id, name }) => id === session.id && name === 'Sesión válida')).toBe(true);
  });

  it('keeps session histories isolated by account', () => {
    const session = addWorkoutSession(
      {
        name: 'Entrenamiento de Ana',
        date: new Date('2026-11-11T12:00:00'),
        durationMinutes: 45,
        caloriesBurned: 0,
        exercises: [],
      },
      'ana@example.com',
    );

    expect(getStoredWorkouts(new Date(), 'ana@example.com').some(({ id }) => id === session.id)).toBe(true);
    expect(getStoredWorkouts(new Date(), 'luis@example.com').some(({ id }) => id === session.id)).toBe(false);
    expect(localStorage.getItem('fittrack.workouts.ana%40example.com')).not.toBeNull();
  });
});
