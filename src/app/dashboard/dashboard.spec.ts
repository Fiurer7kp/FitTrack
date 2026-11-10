import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  const authService = {
    currentUser: signal({ name: 'Ana', email: 'ana@example.com' }),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    authService.logout.mockClear();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the weekly metrics and five recent workouts', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#welcome-title')?.textContent).toContain('Ana');
    expect(element.textContent).toContain('Entrenamientos esta semana');
    expect(element.textContent).toContain('Calorías quemadas');
    expect(element.textContent).toContain('Racha de días');
    expect(element.querySelectorAll('section[aria-labelledby="recent-workouts-title"] article')).toHaveLength(5);
    expect(element.textContent).toContain('Duración');
    expect(element.textContent).toContain('Volumen total');
  });

  it('changes the progress chart range and announces it accessibly', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const rangeButton = Array.from(buttons).find((button) => button.textContent?.includes('90 días'));
    rangeButton?.click();
    await fixture.whenStable();

    expect(component.progressRange()).toBe(90);
    expect(fixture.nativeElement.querySelector('svg')?.getAttribute('aria-label')).toContain('90 días');
    expect(rangeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('logs the user out and replaces the dashboard history entry', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await component.logout();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
