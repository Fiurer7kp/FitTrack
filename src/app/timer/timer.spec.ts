import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timer } from './timer';

describe('Timer', () => {
  let component: Timer;
  let fixture: ComponentFixture<Timer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Timer] }).compileComponents();
    fixture = TestBed.createComponent(Timer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats the stopwatch with hours, minutes, and seconds', () => {
    component.stopwatchSeconds.set(3_661);

    expect(component.stopwatchTime).toBe('01:01:01');
  });

  it('starts, pauses, and resets the stopwatch', () => {
    vi.useFakeTimers();
    component.startStopwatch();
    vi.advanceTimersByTime(3_000);
    component.pauseStopwatch();
    vi.advanceTimersByTime(2_000);

    expect(component.stopwatchSeconds()).toBe(3);

    component.resetStopwatch();
    expect(component.stopwatchTime).toBe('00:00:00');
    expect(component.stopwatchRunning()).toBe(false);
  });

  it('applies configurable rest durations and notifies when the countdown ends', () => {
    vi.useFakeTimers();
    component.setRestPreset(2);
    component.startRest();
    vi.advanceTimersByTime(2_000);
    fixture.detectChanges();

    expect(component.restRemainingSeconds()).toBe(0);
    expect(component.restFinished()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('¡Descanso terminado!');
  });

  it('rejects invalid custom rest durations', () => {
    component.customRestInput.set('0');
    component.applyCustomRest();
    expect(component.restDurationSeconds()).toBe(60);

    component.customRestInput.set('3601');
    component.applyCustomRest();
    expect(component.restDurationSeconds()).toBe(60);
  });

  it('saves a completed stopwatch session and resets the timer', () => {
    localStorage.clear();
    component.stopwatchSeconds.set(90);
    component.sessionName.set('Empuje');
    component.saveSession();

    const saved = JSON.parse(localStorage.getItem('fittrack.workouts') ?? '[]') as Array<{
      name: string;
      durationMinutes: number;
      caloriesBurned: number;
    }>;
    const session = saved.find(({ name }) => name === 'Empuje');

    expect(session).toMatchObject({ durationMinutes: 2, caloriesBurned: 0 });
    expect(component.lastSavedSession()).toBe('Empuje');
    expect(component.stopwatchSeconds()).toBe(0);
  });
});
