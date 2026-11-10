import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const authService = {
    register: vi.fn().mockResolvedValue({ success: true }),
    login: vi.fn().mockResolvedValue({ success: true }),
    sessionNotice: signal<string | null>(null),
    clearSessionNotice: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    authService.register.mockClear();
    authService.login.mockClear();
    authService.sessionNotice.set(null);
    authService.clearSessionNotice.mockClear();
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires a name when creating an account', () => {
    component.setMode('register');
    component.submit();

    expect(component.form.controls.name.hasError('required')).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers the account and opens the dashboard', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.setMode('register');
    component.form.setValue({ name: 'Ana', email: 'ana@example.com', password: 'password123' });

    await component.submit();

    expect(authService.register).toHaveBeenCalledWith('Ana', 'ana@example.com', 'password123');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('logs in and reports invalid credentials', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authService.login.mockResolvedValueOnce({ success: false, reason: 'invalid-credentials' });
    component.form.setValue({ name: '', email: 'ana@example.com', password: 'password123' });

    await component.submit();

    expect(component.errorMessage()).toBe('El correo o la contraseña no son correctos.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('logs in and opens the dashboard with valid credentials', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({ name: '', email: 'ana@example.com', password: 'password123' });

    await component.submit();

    expect(authService.login).toHaveBeenCalledWith('ana@example.com', 'password123');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
