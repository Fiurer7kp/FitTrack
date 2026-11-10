import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ExerciseInput } from './exercise';
import { ExerciseService } from './exercise.service';

const sampleExercise: ExerciseInput = {
  name: 'Press de banca',
  muscleGroup: 'Pecho',
  sets: 4,
  reps: 8,
  weightKg: 70,
  notes: '',
};

describe('ExerciseService', () => {
  const currentUser = signal({ name: 'Ana', email: 'ana@example.com' });

  beforeEach(() => {
    window.localStorage.clear();
    currentUser.set({ name: 'Ana', email: 'ana@example.com' });
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AuthService, useValue: { currentUser } },
      ],
    });
  });

  it('creates, updates, and removes an exercise from local storage', async () => {
    const service = TestBed.inject(ExerciseService);
    await TestBed.tick();

    expect(service.add(sampleExercise)).toEqual({ success: true });
    expect(service.exercises()).toHaveLength(1);
    const created = service.exercises()[0];

    expect(service.update(created.id, { ...sampleExercise, name: 'Press inclinado' })).toEqual({
      success: true,
    });
    expect(service.exercises()[0].name).toBe('Press inclinado');
    expect(service.remove(created.id)).toEqual({ success: true });
    expect(service.exercises()).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem('fittrack.exercises.ana@example.com') ?? 'null')).toEqual(
      [],
    );
  });

  it('keeps exercise lists separate for each signed-in user', async () => {
    const service = TestBed.inject(ExerciseService);
    await TestBed.tick();
    service.add(sampleExercise);

    currentUser.set({ name: 'Luis', email: 'luis@example.com' });
    await TestBed.tick();

    expect(service.exercises()).toEqual([]);
    service.add({ ...sampleExercise, name: 'Sentadilla' });
    currentUser.set({ name: 'Ana', email: 'ana@example.com' });
    await TestBed.tick();

    expect(service.exercises().map(({ name }) => name)).toEqual(['Press de banca']);
  });

  it('reports an unavailable storage write without updating the exercise list', async () => {
    const service = TestBed.inject(ExerciseService);
    await TestBed.tick();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full');
    });

    expect(service.add(sampleExercise)).toEqual({ success: false, reason: 'storage-unavailable' });
    expect(service.exercises()).toEqual([]);
    expect(service.storageUnavailable()).toBe(true);
  });
});
