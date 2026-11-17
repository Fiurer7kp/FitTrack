import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import {
  ExerciseHistoryPoint,
  getExerciseHistory,
  getRecordedWorkouts,
} from '../dashboard/workout';
import {
  EXERCISE_SUGGESTIONS,
  Exercise,
  ExerciseInput,
  MUSCLE_GROUPS,
  MuscleGroup,
} from './exercise';
import { ExerciseService } from './exercise.service';

type HistoryMetric = 'weightKg' | 'reps' | 'volumeKg';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-exercises',
  styleUrl: './exercises.scss',
  templateUrl: './exercises.html',
})
export class Exercises {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly exerciseService = inject(ExerciseService);

  readonly groups = MUSCLE_GROUPS;
  readonly exerciseSuggestions = EXERCISE_SUGGESTIONS;
  readonly suggestionsByGroup = computed(() =>
    this.groups.map((group) => ({
      name: group,
      exercises: this.exerciseSuggestions.filter((suggestion) => suggestion.muscleGroup === group),
    })),
  );
  readonly selectedSuggestion = signal('');
  readonly filterGroups: readonly (MuscleGroup | 'Todos')[] = ['Todos', ...MUSCLE_GROUPS];
  readonly storageUnavailable = this.exerciseService.storageUnavailable;
  readonly exercises = this.exerciseService.exercises;
  readonly query = signal('');
  readonly selectedGroup = signal<MuscleGroup | 'Todos'>('Todos');
  readonly editorOpen = signal(false);
  readonly editingExercise = signal<Exercise | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly historyError = signal<string | null>(null);
  readonly recordedWorkouts = signal(this.loadWorkoutHistory());
  readonly historyExerciseId = signal<string | null>(null);
  readonly historyMetric = signal<HistoryMetric>('weightKg');
  readonly selectedHistoryExercise = computed(
    () => this.exercises().find(({ id }) => id === this.historyExerciseId()) ?? null,
  );
  readonly selectedHistoryPoints = computed(() => {
    const exercise = this.selectedHistoryExercise();
    return exercise
      ? getExerciseHistory(this.recordedWorkouts(), exercise.id, exercise.name)
      : [];
  });
  readonly newestHistoryPoints = computed(() => [...this.selectedHistoryPoints()].reverse());
  readonly historyMetricLabel = computed(() => this.metricLabel(this.historyMetric()));
  readonly historyMetricUnit = computed(() => this.metricUnit(this.historyMetric()));
  readonly historyChartPoints = computed(() => {
    const points = this.selectedHistoryPoints();
    const metric = this.historyMetric();
    if (points.length === 0) {
      return [];
    }

    const values = points.map((point) => point[metric]);
    const maximum = Math.max(...values, 1);
    const firstDate = points[0].date.getTime();
    const lastDate = points[points.length - 1].date.getTime();
    const dateSpan = lastDate - firstDate;
    return points.map((point, index) => ({
      ...point,
      x: dateSpan === 0 ? 306 : 48 + ((point.date.getTime() - firstDate) / dateSpan) * 520,
      y: 210 - (values[index] / maximum) * 170,
    }));
  });
  readonly historyChartPolyline = computed(() =>
    this.historyChartPoints().map(({ x, y }) => `${x},${y}`).join(' '),
  );
  readonly filteredExercises = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es');
    const selectedGroup = this.selectedGroup();
    return this.exercises().filter((exercise) => {
      const matchesName = exercise.name.toLocaleLowerCase('es').includes(query);
      return matchesName && (selectedGroup === 'Todos' || exercise.muscleGroup === selectedGroup);
    });
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    muscleGroup: ['', Validators.required],
    sets: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    reps: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    weightKg: ['', [Validators.pattern(/^(?:\d+(?:\.\d+)?|\.\d+)$/)]],
    notes: [''],
  });

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.editorOpen()) {
      this.closeEditor();
    }
  }

  openCreate(): void {
    this.editingExercise.set(null);
    this.selectedSuggestion.set('');
    this.form.reset({ name: '', muscleGroup: '', sets: '', reps: '', weightKg: '', notes: '' });
    this.errorMessage.set(null);
    this.editorOpen.set(true);
  }

  openEdit(exercise: Exercise): void {
    this.editingExercise.set(exercise);
    this.selectedSuggestion.set('');
    this.form.reset({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: String(exercise.sets),
      reps: String(exercise.reps),
      weightKg: exercise.weightKg === null ? '' : String(exercise.weightKg),
      notes: exercise.notes,
    });
    this.errorMessage.set(null);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.editingExercise.set(null);
    this.errorMessage.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    if (!this.isMuscleGroup(values.muscleGroup)) {
      this.form.controls.muscleGroup.setErrors({ required: true });
      this.form.controls.muscleGroup.markAsTouched();
      return;
    }

    const input: ExerciseInput = {
      name: values.name.trim(),
      muscleGroup: values.muscleGroup,
      sets: Number(values.sets),
      reps: Number(values.reps),
      weightKg: values.weightKg ? Number(values.weightKg) : null,
      notes: values.notes.trim(),
    };
    const exercise = this.editingExercise();
    const result = exercise
      ? this.exerciseService.update(exercise.id, input)
      : this.exerciseService.add(input);

    if (!result.success) {
      this.errorMessage.set('No se pudo guardar el ejercicio. Revisa el almacenamiento e inténtalo de nuevo.');
      return;
    }

    this.closeEditor();
  }

  delete(exercise: Exercise): void {
    const routineResult = this.exerciseService.getRoutineNamesUsing(exercise.id);
    if (!routineResult.success) {
      this.errorMessage.set('No se pudieron comprobar las rutinas antes de eliminar. Inténtalo de nuevo.');
      return;
    }

    const routineWarning =
      routineResult.routineNames.length > 0
        ? ` Este ejercicio está en las rutinas: ${routineResult.routineNames.join(', ')}.`
        : '';
    if (!window.confirm(`¿Eliminar "${exercise.name}"?${routineWarning} Esta acción no se puede deshacer.`)) {
      return;
    }

    const result = this.exerciseService.remove(exercise.id);
    if (!result.success) {
      this.errorMessage.set('No se pudo eliminar el ejercicio. Revisa el almacenamiento e inténtalo de nuevo.');
    } else {
      this.errorMessage.set(null);
    }
  }

  setGroup(group: MuscleGroup | 'Todos'): void {
    this.selectedGroup.set(group);
  }

  setQuery(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
    }
  }

  updateExerciseName(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const normalizedName = event.target.value.trim().toLocaleLowerCase('es');
    const suggestion = this.exerciseSuggestions.find(
      ({ name }) => name.toLocaleLowerCase('es') === normalizedName,
    );
    if (suggestion) {
      this.form.controls.muscleGroup.setValue(suggestion.muscleGroup);
    }
  }

  selectExerciseSuggestion(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) {
      return;
    }

    const selectedName = event.target.value;
    const suggestion = this.exerciseSuggestions.find(({ name }) => name === selectedName);
    if (!suggestion) {
      return;
    }

    this.form.controls.name.setValue(suggestion.name);
    this.form.controls.muscleGroup.setValue(suggestion.muscleGroup);
    this.selectedSuggestion.set('');
  }

  toggleHistory(exercise: Exercise): void {
    this.historyExerciseId.update((current) => (current === exercise.id ? null : exercise.id));
    this.historyMetric.set('weightKg');
  }

  setHistoryMetric(metric: HistoryMetric): void {
    this.historyMetric.set(metric);
  }

  historyValue(point: ExerciseHistoryPoint): number {
    return point[this.historyMetric()];
  }

  formatHistoryDate(date: Date): string {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  hasError(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  get exerciseCount(): number {
    return this.exercises().length;
  }

  private isMuscleGroup(value: string): value is MuscleGroup {
    return this.groups.some((group) => group === value);
  }

  private loadWorkoutHistory() {
    try {
      return getRecordedWorkouts(this.auth.currentUser()?.email ?? 'default');
    } catch (error) {
      this.historyError.set(
        error instanceof Error ? error.message : 'No se pudo cargar el historial de ejercicios.',
      );
      return [];
    }
  }

  private metricLabel(metric: HistoryMetric): string {
    if (metric === 'weightKg') return 'Peso máximo';
    if (metric === 'reps') return 'Repeticiones';
    return 'Volumen';
  }

  private metricUnit(metric: HistoryMetric): string {
    if (metric === 'weightKg') return 'kg';
    if (metric === 'reps') return 'rep';
    return 'kg';
  }
}
