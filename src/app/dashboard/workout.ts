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

export interface ProgressPoint {
  id: string;
  name: string;
  date: Date;
  weightKg: number;
  x: number;
  y: number;
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

const WORKOUT_STORAGE_KEY = 'fittrack.workouts';

export function getStoredWorkouts(
  referenceDate: Date = new Date(),
  accountEmail = 'default',
): Workout[] {
  if (typeof window === 'undefined') {
    return createMockWorkouts(referenceDate);
  }

  const key = workoutStorageKey(accountEmail);
  let stored = window.localStorage.getItem(key);
  if (stored === null && accountEmail !== 'default') {
    stored = window.localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (stored !== null) {
      window.localStorage.setItem(key, stored);
      window.localStorage.removeItem(WORKOUT_STORAGE_KEY);
    }
  }

  if (stored === null) {
    return createMockWorkouts(referenceDate);
  }

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Los entrenamientos guardados tienen un formato inválido.');
  }

  const workouts = parsed.map((entry) => normalizeStoredWorkout(entry));
  if (workouts.some((workout) => workout === null)) {
    throw new Error('Una o más sesiones guardadas tienen un formato inválido.');
  }

  return workouts.filter((workout): workout is Workout => workout !== null);
}

export function addWorkoutSession(
  workoutInput: Partial<Workout> & Pick<Workout, 'name' | 'durationMinutes' | 'date' | 'exercises'>,
  accountEmail = 'default',
): Workout {
  const workouts = getStoredWorkouts(new Date(), accountEmail);
  const nextWorkout: Workout = {
    id: workoutInput.id ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: workoutInput.name.trim() || 'Entrenamiento',
    date: normalizeDate(workoutInput.date) ?? new Date(),
    durationMinutes: Math.max(1, Math.round(Number(workoutInput.durationMinutes) || 1)),
    caloriesBurned: Number.isFinite(workoutInput.caloriesBurned) ? Math.max(0, Math.round(workoutInput.caloriesBurned ?? 0)) : 0,
    exercises: Array.isArray(workoutInput.exercises)
      ? workoutInput.exercises
          .map((exercise) => normalizeExercise(exercise))
          .filter((exercise): exercise is WorkoutExercise => exercise !== null)
      : [],
  };

  const nextWorkouts = [...workouts, nextWorkout].sort(
    (first, second) => second.date.getTime() - first.date.getTime(),
  );

  persistWorkouts(nextWorkouts, accountEmail);
  return nextWorkout;
}

export function removeWorkoutSession(id: string, accountEmail = 'default'): Workout[] {
  const nextWorkouts = getStoredWorkouts(new Date(), accountEmail).filter((workout) => workout.id !== id);
  persistWorkouts(nextWorkouts, accountEmail);
  return nextWorkouts;
}

export function updateWorkoutSession(
  id: string,
  changes: Pick<Workout, 'name' | 'date' | 'durationMinutes' | 'caloriesBurned'>,
  accountEmail = 'default',
): Workout {
  const workouts = getStoredWorkouts(new Date(), accountEmail);
  const existing = workouts.find((workout) => workout.id === id);
  if (!existing) {
    throw new Error('No se encontró la sesión que quieres editar.');
  }

  const name = changes.name.trim();
  const durationMinutes = Number(changes.durationMinutes);
  const caloriesBurned = Number(changes.caloriesBurned);
  if (!name || !Number.isFinite(durationMinutes) || durationMinutes < 1 ||
      !Number.isFinite(caloriesBurned) || caloriesBurned < 0 ||
      Number.isNaN(changes.date.getTime())) {
    throw new Error('Revisa el nombre, fecha, duración y calorías de la sesión.');
  }

  const updated: Workout = {
    ...existing,
    name,
    date: new Date(changes.date),
    durationMinutes: Math.round(durationMinutes),
    caloriesBurned: Math.round(caloriesBurned),
  };
  persistWorkouts(
    workouts.map((workout) => (workout.id === id ? updated : workout)),
    accountEmail,
  );
  return updated;
}

export function createMockWorkouts(referenceDate: Date = new Date()): Workout[] {
  const dayOffsets = [0, -1, -2, -4, -7, -9, -14, -20, -27, -35, -44, -55, -67, -80, -89];

  return dayOffsets.map((dayOffset, index) => {
    const workout = mockWorkoutTemplates[index % mockWorkoutTemplates.length];
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(12, 0, 0, 0);
    return { ...workout, id: `${workout.id}-${index}`, date };
  });
}

export function getProgressPoints(
  workouts: Workout[],
  rangeDays: 30 | 90,
  referenceDate: Date = new Date(),
): ProgressPoint[] {
  const today = localDayNumber(referenceDate);
  const entries = workouts
    .map((workout) => ({
      workout,
      daysAgo: today - localDayNumber(workout.date),
      weightKg: Math.max(0, ...workout.exercises.map(({ weightKg }) => weightKg)),
    }))
    .filter(({ daysAgo, weightKg }) => daysAgo >= 0 && daysAgo < rangeDays && weightKg > 0)
    .sort((first, second) => first.workout.date.getTime() - second.workout.date.getTime());

  if (entries.length === 0) {
    return [];
  }

  const maxWeight = Math.ceil(Math.max(...entries.map(({ weightKg }) => weightKg)) / 10) * 10;
  const chartLeft = 46;
  const chartTop = 18;
  const chartWidth = 538;
  const chartHeight = 192;

  return entries.map(({ workout, daysAgo, weightKg }) => ({
    id: workout.id,
    name: workout.name,
    date: workout.date,
    weightKg,
    x: chartLeft + ((rangeDays - 1 - daysAgo) / (rangeDays - 1)) * chartWidth,
    y: chartTop + chartHeight * (1 - weightKg / maxWeight),
  }));
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

function localDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

function normalizeStoredWorkout(value: unknown): Workout | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record['id'] !== 'string' || typeof record['name'] !== 'string') {
    return null;
  }

  const date = normalizeDate(record['date']);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  if (typeof record['durationMinutes'] !== 'number' || typeof record['caloriesBurned'] !== 'number') {
    return null;
  }

  if (!Array.isArray(record['exercises'])) {
    return null;
  }

  const exercises = record['exercises'].map((exercise) => normalizeExercise(exercise));
  if (exercises.some((exercise) => exercise === null)) {
    return null;
  }

  return {
    id: record['id'],
    name: record['name'],
    date,
    durationMinutes: Math.max(1, Math.round(record['durationMinutes'])),
    caloriesBurned: Math.max(0, Math.round(record['caloriesBurned'])),
    exercises: exercises.filter((exercise): exercise is WorkoutExercise => exercise !== null),
  };
}

function normalizeExercise(exercise: unknown): WorkoutExercise | null {
  if (typeof exercise !== 'object' || exercise === null) {
    return null;
  }

  const record = exercise as Record<string, unknown>;
  if (typeof record['name'] !== 'string' || typeof record['sets'] !== 'number' || typeof record['reps'] !== 'number' || typeof record['weightKg'] !== 'number') {
    return null;
  }

  return {
    name: record['name'],
    sets: Math.max(0, Math.round(record['sets'])),
    reps: Math.max(0, Math.round(record['reps'])),
    weightKg: Math.max(0, Number(record['weightKg'])),
  };
}

function normalizeDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function workoutStorageKey(accountEmail: string): string {
  return accountEmail === 'default'
    ? WORKOUT_STORAGE_KEY
    : `${WORKOUT_STORAGE_KEY}.${encodeURIComponent(accountEmail)}`;
}

function persistWorkouts(workouts: Workout[], accountEmail: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    workoutStorageKey(accountEmail),
    JSON.stringify(
      workouts.map((workout) => ({
        ...workout,
        date: workout.date.toISOString(),
      })),
    ),
  );
}
