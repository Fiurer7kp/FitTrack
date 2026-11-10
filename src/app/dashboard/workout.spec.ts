import {
  calculateWeeklyMetrics,
  getProgressPoints,
  getRecentWorkouts,
  getWorkoutVolumeKg,
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
});
