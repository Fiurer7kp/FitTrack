import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
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
});
