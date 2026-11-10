import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Exercise, ExerciseInput, MUSCLE_GROUPS, MuscleGroup } from './exercise';
import { ExerciseService } from './exercise.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-exercises',
  styleUrl: './exercises.scss',
  templateUrl: './exercises.html',
})
export class Exercises {
  private readonly fb = inject(FormBuilder);
  private readonly exerciseService = inject(ExerciseService);

  readonly groups = MUSCLE_GROUPS;
  readonly filterGroups: readonly (MuscleGroup | 'Todos')[] = ['Todos', ...MUSCLE_GROUPS];
  readonly storageUnavailable = this.exerciseService.storageUnavailable;
  readonly exercises = this.exerciseService.exercises;
  readonly query = signal('');
  readonly selectedGroup = signal<MuscleGroup | 'Todos'>('Todos');
  readonly editorOpen = signal(false);
  readonly editingExercise = signal<Exercise | null>(null);
  readonly errorMessage = signal<string | null>(null);
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
    this.form.reset({ name: '', muscleGroup: '', sets: '', reps: '', weightKg: '', notes: '' });
    this.errorMessage.set(null);
    this.editorOpen.set(true);
  }

  openEdit(exercise: Exercise): void {
    this.editingExercise.set(exercise);
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
}
