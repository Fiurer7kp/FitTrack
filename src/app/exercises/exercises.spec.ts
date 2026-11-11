import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ExerciseService } from './exercise.service';
import { Exercises } from './exercises';

describe('Exercises', () => {
  const currentUser = signal({ name: 'Ana', email: 'ana@example.com' });

  beforeEach(async () => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    currentUser.set({ name: 'Ana', email: 'ana@example.com' });
    await TestBed.configureTestingModule({
      imports: [Exercises],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { currentUser } },
      ],
    }).compileComponents();
  });

  async function createComponent() {
    const fixture = TestBed.createComponent(Exercises);
    await fixture.whenStable();
    await TestBed.tick();
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function fillValidForm(component: Exercises, name = 'Press de banca'): void {
    component.form.setValue({
      name,
      muscleGroup: 'Pecho',
      sets: '4',
      reps: '8',
      weightKg: '70',
      notes: '',
    });
  }

  it('shows a useful empty state and opens the create panel', async () => {
    const { fixture, component } = await createComponent();

    expect(fixture.nativeElement.textContent).toContain('Tu lista está vacía');
    component.openCreate();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Nuevo ejercicio');
  });

  it('connects the navigation links to their routes', async () => {
    const { fixture } = await createComponent();
    const links = fixture.nativeElement.querySelectorAll('header a') as NodeListOf<HTMLAnchorElement>;

    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/dashboard',
      '/dashboard',
      '/calendar',
      '/routines',
      '/timer',
      '/profile',
    ]);
  });

  it('requires a non-empty name and positive integer sets and reps', async () => {
    const { fixture, component } = await createComponent();
    component.openCreate();
    component.form.setValue({
      name: '   ',
      muscleGroup: 'Pecho',
      sets: '1.5',
      reps: '0',
      weightKg: '',
      notes: '',
    });

    component.save();
    fixture.detectChanges();

    expect(component.exercises()).toEqual([]);
    expect(component.form.controls.name.invalid).toBe(true);
    expect(component.form.controls.sets.invalid).toBe(true);
    expect(component.form.controls.reps.invalid).toBe(true);
  });

  it('creates and edits an exercise using the same side panel', async () => {
    const { fixture, component } = await createComponent();
    component.openCreate();
    fillValidForm(component);
    component.save();
    fixture.detectChanges();

    expect(component.exercises()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Press de banca');
    expect(fixture.nativeElement.textContent).toContain('4 × 8');

    component.openEdit(component.exercises()[0]);
    expect(component.form.controls.name.value).toBe('Press de banca');
    fillValidForm(component, 'Press inclinado');
    component.save();
    fixture.detectChanges();

    expect(component.exercises()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Press inclinado');
  });

  it('combines live name search with a muscle group filter', async () => {
    const { fixture, component } = await createComponent();
    const service = TestBed.inject(ExerciseService);
    service.add({
      name: 'Press de banca',
      muscleGroup: 'Pecho',
      sets: 4,
      reps: 8,
      weightKg: 70,
      notes: '',
    });
    service.add({
      name: 'Remo con barra',
      muscleGroup: 'Espalda',
      sets: 4,
      reps: 10,
      weightKg: 45,
      notes: '',
    });
    fixture.detectChanges();

    component.setGroup('Pecho');
    component.query.set('press');
    fixture.detectChanges();
    expect(component.filteredExercises().map(({ name }) => name)).toEqual(['Press de banca']);

    component.query.set('remo');
    fixture.detectChanges();
    expect(component.filteredExercises()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No encontramos ejercicios');
  });

  it('asks for confirmation before removing an exercise', async () => {
    const { fixture, component } = await createComponent();
    component.openCreate();
    fillValidForm(component);
    component.save();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.delete(component.exercises()[0]);

    expect(confirm).toHaveBeenCalledOnce();
    expect(component.exercises()).toHaveLength(1);
    confirm.mockReturnValue(true);
    component.delete(component.exercises()[0]);
    fixture.detectChanges();
    expect(component.exercises()).toEqual([]);
  });

  it('warns when an exercise is included in a routine', async () => {
    const { component } = await createComponent();
    component.openCreate();
    fillValidForm(component);
    component.save();
    const exercise = component.exercises()[0];
    window.localStorage.setItem(
      'fittrack.routines.ana@example.com',
      JSON.stringify([
        { id: 'routine-1', name: 'Empuje', dayOfWeek: 'Lunes', exerciseIds: [exercise.id] },
      ]),
    );
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.delete(exercise);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('Este ejercicio está en las rutinas: Empuje'),
    );
    expect(component.exercises()).toHaveLength(1);
  });
});
