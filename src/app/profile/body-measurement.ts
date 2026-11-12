export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
}

const STORAGE_PREFIX = 'fittrack.body-measurements.';

export function getBodyMeasurements(accountEmail: string): BodyMeasurement[] {
  if (typeof window === 'undefined' || !accountEmail) {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey(accountEmail));
  if (raw === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isBodyMeasurement)) {
    throw new Error('El historial de medidas corporales guardado no es válido.');
  }

  return [...parsed].sort((first, second) => second.date.localeCompare(first.date));
}

export function addBodyMeasurement(
  input: Omit<BodyMeasurement, 'id'>,
  accountEmail: string,
): BodyMeasurement[] {
  if (!accountEmail || !isBodyMeasurement({ ...input, id: 'validation' })) {
    throw new Error('Registra una fecha válida y al menos una medida positiva.');
  }

  if (typeof window === 'undefined') {
    throw new Error('El almacenamiento local no está disponible.');
  }

  const current = getBodyMeasurements(accountEmail);
  const next = [
    { ...input, id: `measurement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
    ...current,
  ].sort((first, second) => second.date.localeCompare(first.date));
  window.localStorage.setItem(storageKey(accountEmail), JSON.stringify(next));
  return next;
}

function isBodyMeasurement(value: unknown): value is BodyMeasurement {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item['id'] === 'string' &&
    typeof item['date'] === 'string' &&
    isValidDate(item['date']) &&
    isOptionalPositiveNumber(item['weightKg']) &&
    isOptionalPositiveNumber(item['waistCm']) &&
    (item['weightKg'] !== null || item['waistCm'] !== null)
  );
}

function isOptionalPositiveNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value > 0);
}

function isValidDate(value: string): boolean {
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

function storageKey(accountEmail: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(accountEmail)}`;
}
