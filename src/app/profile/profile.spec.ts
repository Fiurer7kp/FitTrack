import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { getBodyMeasurements } from './body-measurement';
import { Profile } from './profile';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  const currentUser = signal({
    name: 'Ana',
    email: 'ana@example.com',
    weightKg: 65,
    heightCm: 170,
    goal: 'Ganar fuerza',
  });
  const authService = {
    currentUser,
    updateProfile: vi.fn().mockReturnValue({ success: true }),
  };

  beforeEach(async () => {
    localStorage.clear();
    currentUser.set({
      name: 'Ana',
      email: 'ana@example.com',
      weightKg: 65,
      heightCm: 170,
      goal: 'Ganar fuerza',
    });
    authService.updateProfile.mockReset().mockReturnValue({ success: true });
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();
    fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
  });

  it('shows the profile and general workout statistics', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ana');
    expect(fixture.nativeElement.textContent).toContain('65 kg');
    expect(fixture.nativeElement.textContent).toContain('170 cm');
    expect(fixture.nativeElement.textContent).toContain('Estadísticas generales');
    expect(fixture.componentInstance.stats().totalWorkouts).toBeGreaterThan(0);
    expect(fixture.componentInstance.stats().bestStreak).toBeGreaterThan(0);
    expect(fixture.componentInstance.stats().totalVolumeKg).toBeGreaterThan(0);
  });

  it('validates positive weight and height before saving', () => {
    const component = fixture.componentInstance;
    component.startEditing();
    component.form.setValue({ name: 'Ana', weightKg: '0', heightCm: '-10', goal: '' });

    component.saveProfile();

    expect(component.form.controls.weightKg.invalid).toBe(true);
    expect(component.form.controls.heightCm.invalid).toBe(true);
    expect(authService.updateProfile).not.toHaveBeenCalled();
  });

  it('saves profile fields and exits edit mode', () => {
    const component = fixture.componentInstance;
    component.startEditing();
    component.form.setValue({ name: 'Ana María', weightKg: '64.5', heightCm: '168', goal: 'Resistencia' });

    component.saveProfile();

    expect(authService.updateProfile).toHaveBeenCalledWith({
      name: 'Ana María',
      weightKg: 64.5,
      heightCm: 168,
      goal: 'Resistencia',
    });
    expect(component.editing()).toBe(false);
    expect(component.successMessage()).toBe('Perfil actualizado.');
  });

  it('stores dated body measurements per account and calculates the change over time', () => {
    const component = fixture.componentInstance;
    component.bodyMeasurementForm.setValue({
      date: '2026-04-10',
      weightKg: '70',
      waistCm: '85',
    });
    component.saveBodyMeasurement();
    component.bodyMeasurementForm.setValue({
      date: '2026-05-10',
      weightKg: '68.5',
      waistCm: '82',
    });
    component.saveBodyMeasurement();

    expect(component.bodyMeasurements()).toHaveLength(2);
    expect(component.bodyMeasurements()[0]).toMatchObject({
      date: '2026-05-10',
      weightKg: 68.5,
      waistCm: 82,
    });
    expect(component.bodyMeasurementTrend()).toEqual({ weightKg: -1.5, waistCm: -3 });
    expect(
      JSON.parse(localStorage.getItem('fittrack.body-measurements.ana%40example.com') ?? '[]'),
    ).toHaveLength(2);
    expect(getBodyMeasurements('other@example.com')).toEqual([]);
  });

  it('requires at least one measurement before saving', () => {
    const component = fixture.componentInstance;
    component.bodyMeasurementForm.setValue({
      date: '2026-05-10',
      weightKg: '',
      waistCm: '',
    });

    component.saveBodyMeasurement();

    expect(component.bodyMeasurements()).toEqual([]);
    expect(component.bodyMeasurementError()).toContain('Registra el peso');
  });
});
