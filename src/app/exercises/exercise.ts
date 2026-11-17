export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Pierna', 'Hombro', 'Brazos', 'Core'] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  reps: number;
  weightKg: number | null;
  notes: string;
}

export type ExerciseInput = Omit<Exercise, 'id'>;

export interface ExerciseSuggestion {
  name: string;
  muscleGroup: MuscleGroup;
}

export const EXERCISE_SUGGESTIONS: readonly ExerciseSuggestion[] = [
  { name: 'Press de banca', muscleGroup: 'Pecho' },
  { name: 'Press inclinado con barra', muscleGroup: 'Pecho' },
  { name: 'Press inclinado con mancuernas', muscleGroup: 'Pecho' },
  { name: 'Press declinado', muscleGroup: 'Pecho' },
  { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho' },
  { name: 'Cruce de poleas', muscleGroup: 'Pecho' },
  { name: 'Press de pecho en máquina', muscleGroup: 'Pecho' },
  { name: 'Flexiones', muscleGroup: 'Pecho' },
  { name: 'Fondos para pecho', muscleGroup: 'Pecho' },
  { name: 'Dominadas', muscleGroup: 'Espalda' },
  { name: 'Jalón al pecho', muscleGroup: 'Espalda' },
  { name: 'Remo con barra', muscleGroup: 'Espalda' },
  { name: 'Remo con mancuerna', muscleGroup: 'Espalda' },
  { name: 'Remo en polea baja', muscleGroup: 'Espalda' },
  { name: 'Peso muerto', muscleGroup: 'Espalda' },
  { name: 'Pullover en polea', muscleGroup: 'Espalda' },
  { name: 'Remo en máquina', muscleGroup: 'Espalda' },
  { name: 'Sentadilla con barra', muscleGroup: 'Pierna' },
  { name: 'Sentadilla goblet', muscleGroup: 'Pierna' },
  { name: 'Prensa de piernas', muscleGroup: 'Pierna' },
  { name: 'Peso muerto rumano', muscleGroup: 'Pierna' },
  { name: 'Zancadas', muscleGroup: 'Pierna' },
  { name: 'Hip thrust', muscleGroup: 'Pierna' },
  { name: 'Extensión de cuádriceps', muscleGroup: 'Pierna' },
  { name: 'Curl femoral', muscleGroup: 'Pierna' },
  { name: 'Elevación de gemelos', muscleGroup: 'Pierna' },
  { name: 'Press militar con barra', muscleGroup: 'Hombro' },
  { name: 'Press de hombros con mancuernas', muscleGroup: 'Hombro' },
  { name: 'Elevaciones laterales', muscleGroup: 'Hombro' },
  { name: 'Elevaciones frontales', muscleGroup: 'Hombro' },
  { name: 'Pájaros con mancuernas', muscleGroup: 'Hombro' },
  { name: 'Face pull', muscleGroup: 'Hombro' },
  { name: 'Encogimientos de trapecio', muscleGroup: 'Hombro' },
  { name: 'Curl de bíceps con barra', muscleGroup: 'Brazos' },
  { name: 'Curl alterno con mancuernas', muscleGroup: 'Brazos' },
  { name: 'Curl martillo', muscleGroup: 'Brazos' },
  { name: 'Curl de bíceps en polea', muscleGroup: 'Brazos' },
  { name: 'Extensión de tríceps en polea', muscleGroup: 'Brazos' },
  { name: 'Press francés', muscleGroup: 'Brazos' },
  { name: 'Patada de tríceps', muscleGroup: 'Brazos' },
  { name: 'Plancha', muscleGroup: 'Core' },
  { name: 'Crunch abdominal', muscleGroup: 'Core' },
  { name: 'Elevación de piernas', muscleGroup: 'Core' },
  { name: 'Giros rusos', muscleGroup: 'Core' },
  { name: 'Dead bug', muscleGroup: 'Core' },
  { name: 'Mountain climbers', muscleGroup: 'Core' },
  { name: 'Rueda abdominal', muscleGroup: 'Core' },
  { name: 'Pallof press', muscleGroup: 'Core' },
];
