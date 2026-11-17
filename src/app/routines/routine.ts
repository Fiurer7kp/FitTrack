export interface Routine {
  id: string;
  name: string;
  dayOfWeek: string;
  exerciseIds: string[];
}

export interface ScheduledRoutine {
  id: string;
  routineId: string;
  routineName: string;
  date: string;
}

const ROUTINE_STORAGE_PREFIX = 'fittrack.routines.';
const SCHEDULE_STORAGE_PREFIX = 'fittrack.scheduled-routines.';
const ROUTINE_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function getStoredRoutines(accountEmail: string): Routine[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(`${ROUTINE_STORAGE_PREFIX}${accountEmail}`);
  if (raw === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isRoutine)) {
    throw new Error('Los datos de rutinas guardados no son válidos.');
  }
  return parsed;
}

export function getScheduledRoutines(accountEmail: string): ScheduledRoutine[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(`${SCHEDULE_STORAGE_PREFIX}${accountEmail}`);
  if (raw === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isScheduledRoutine)) {
    throw new Error('Los planes guardados en el calendario no son válidos.');
  }
  return parsed;
}

export function scheduleRoutine(
  routine: Routine,
  date: Date,
  accountEmail: string,
): ScheduledRoutine[] {
  if (Number.isNaN(date.getTime()) || !accountEmail) {
    throw new Error('Selecciona una fecha válida y una cuenta activa.');
  }

  const scheduled = getScheduledRoutines(accountEmail);
  const dateKey = localDateKey(date);
  if (scheduled.some((entry) => entry.routineId === routine.id && entry.date === dateKey)) {
    throw new Error('Esta rutina ya está planificada para ese día.');
  }

  const entry: ScheduledRoutine = {
    id: crypto.randomUUID(),
    routineId: routine.id,
    routineName: routine.name,
    date: dateKey,
  };
  const next = [...scheduled, entry];
  saveScheduledRoutines(accountEmail, next);
  return next;
}

export function removeScheduledRoutine(id: string, accountEmail: string): ScheduledRoutine[] {
  const next = getScheduledRoutines(accountEmail).filter((entry) => entry.id !== id);
  saveScheduledRoutines(accountEmail, next);
  return next;
}

function isRoutine(value: unknown): value is Routine {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item['id'] === 'string' &&
    typeof item['name'] === 'string' &&
    typeof item['dayOfWeek'] === 'string' &&
    ROUTINE_DAYS.some((day) => day === item['dayOfWeek']) &&
    Array.isArray(item['exerciseIds']) &&
    item['exerciseIds'].every((id) => typeof id === 'string')
  );
}

function isScheduledRoutine(value: unknown): value is ScheduledRoutine {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item['id'] === 'string' &&
    typeof item['routineId'] === 'string' &&
    typeof item['routineName'] === 'string' &&
    typeof item['date'] === 'string' &&
    isValidDateKey(item['date'])
  );
}

function isValidDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function saveScheduledRoutines(accountEmail: string, routines: ScheduledRoutine[]): void {
  window.localStorage.setItem(
    `${SCHEDULE_STORAGE_PREFIX}${accountEmail}`,
    JSON.stringify(routines),
  );
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
