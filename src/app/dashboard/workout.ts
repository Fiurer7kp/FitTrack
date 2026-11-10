export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface Workout {
  id: string;
  name: string;
  date: Date;
  durationMinutes: number;
  caloriesBurned: number;
  exercises: WorkoutExercise[];
}

export interface WeeklyMetrics {
  workoutCount: number;
  caloriesBurned: number;
  streakDays: number;
  goalProgress: number;
}

const mockWorkoutTemplates: Omit<Workout, 'date'>[] = [
  {
    id: 'upper-a',
    name: 'Tren superior A',
    durationMinutes: 55,
    caloriesBurned: 360,
    exercises: [
      { name: 'Press de banca', sets: 4, reps: 8, weightKg: 70 },
      { name: 'Remo con barra', sets: 4, reps: 10, weightKg: 45 },
      { name: 'Press militar', sets: 3, reps: 10, weightKg: 30 },
    ],
  },
  {
    id: 'lower-a',
    name: 'Pierna A',
    durationMinutes: 62,
    caloriesBurned: 430,
    exercises: [
      { name: 'Sentadilla', sets: 4, reps: 8, weightKg: 80 },
      { name: 'Peso muerto rumano', sets: 3, reps: 10, weightKg: 60 },
    ],
  },
  {
    id: 'upper-b',
    name: 'Tren superior B',
    durationMinutes: 48,
    caloriesBurned: 315,
    exercises: [
      { name: 'Dominadas', sets: 4, reps: 8, weightKg: 0 },
      { name: 'Press inclinado', sets: 3, reps: 10, weightKg: 55 },
    ],
  },
  {
    id: 'lower-b',
    name: 'Pierna B',
    durationMinutes: 58,
    caloriesBurned: 405,
    exercises: [
      { name: 'Peso muerto', sets: 4, reps: 6, weightKg: 100 },
      { name: 'Zancadas', sets: 3, reps: 10, weightKg: 16 },
    ],
  },
  {
    id: 'full-body',
    name: 'Cuerpo completo',
    durationMinutes: 50,
    caloriesBurned: 340,
    exercises: [
      { name: 'Press de banca', sets: 3, reps: 10, weightKg: 60 },
      { name: 'Remo con mancuerna', sets: 3, reps: 12, weightKg: 24 },
    ],
  },
  {
    id: 'conditioning',
    name: 'Acondicionamiento',
    durationMinutes: 35,
    caloriesBurned: 290,
    exercises: [
      { name: 'Sentadilla goblet', sets: 3, reps: 12, weightKg: 20 },
      { name: 'Flexiones', sets: 3, reps: 15, weightKg: 0 },
    ],
  },
];

export function createMockWorkouts(referenceDate: Date = new Date()): Workout[] {
  const dayOffsets = [0, -1, -2, -4, -7, -9];

  return mockWorkoutTemplates.map((workout, index) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + dayOffsets[index]);
    date.setHours(12, 0, 0, 0);
    return { ...workout, date };
  });
}

export function getWorkoutVolumeKg(workout: Workout): number {
  return workout.exercises.reduce(
    (volume, exercise) => volume + exercise.sets * exercise.reps * exercise.weightKg,
    0,
  );
}

export function getRecentWorkouts(workouts: Workout[], limit = 5): Workout[] {
  return [...workouts]
    .sort((first, second) => second.date.getTime() - first.date.getTime())
    .slice(0, Math.max(0, limit));
}

export function calculateWeeklyMetrics(
  workouts: Workout[],
  weeklyGoal: number,
  referenceDate: Date = new Date(),
): WeeklyMetrics {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  const pastWorkouts = workouts.filter((workout) => {
    const workoutDay = new Date(workout.date);
    workoutDay.setHours(0, 0, 0, 0);
    return workoutDay <= today;
  });
  const thisWeeksWorkouts = pastWorkouts.filter((workout) => workout.date >= weekStart);
  const dates = new Set(pastWorkouts.map(({ date }) => localDateKey(date)));
  const currentOrPreviousDay = new Date(today);
  if (!dates.has(localDateKey(currentOrPreviousDay))) {
    currentOrPreviousDay.setDate(currentOrPreviousDay.getDate() - 1);
  }

  let streakDays = 0;
  while (dates.has(localDateKey(currentOrPreviousDay))) {
    streakDays += 1;
    currentOrPreviousDay.setDate(currentOrPreviousDay.getDate() - 1);
  }

  return {
    workoutCount: thisWeeksWorkouts.length,
    caloriesBurned: thisWeeksWorkouts.reduce((total, workout) => total + workout.caloriesBurned, 0),
    streakDays,
    goalProgress: weeklyGoal > 0 ? Math.min(100, Math.round((thisWeeksWorkouts.length / weeklyGoal) * 100)) : 0,
  };
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
