import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
  });

  it('stores the account and starts a session when registering', async () => {
    const service = TestBed.inject(AuthService);

    const result = await service.register('Ana', 'ANA@example.com', 'password123');

    expect(result).toEqual({ success: true });
    expect(service.currentUser()).toEqual({ name: 'Ana', email: 'ana@example.com' });
    const stored = JSON.parse(window.localStorage.getItem('fittrack.auth') ?? '{}');
    expect(stored.accounts[0].password).toBeUndefined();
    expect(stored.accounts[0].passwordHash).toBeTruthy();
  });

  it('rejects duplicate email addresses regardless of letter case', async () => {
    const service = TestBed.inject(AuthService);
    await service.register('Ana', 'ana@example.com', 'password123');

    const result = await service.register('Another Ana', 'ANA@example.com', 'password456');

    expect(result).toEqual({ success: false, reason: 'email-in-use' });
  });

  it('validates credentials and clears the active session on logout', async () => {
    const service = TestBed.inject(AuthService);
    await service.register('Ana', 'ana@example.com', 'password123');
    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(await service.login('ana@example.com', 'wrongpass')).toEqual({
      success: false,
      reason: 'invalid-credentials',
    });
    expect(await service.login('ANA@example.com', 'password123')).toEqual({ success: true });
    expect(service.currentUser()?.email).toBe('ana@example.com');

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(JSON.parse(window.localStorage.getItem('fittrack.auth') ?? '{}').activeEmail).toBeNull();
  });

  it('clears the in-memory session and reports when logout cannot update storage', async () => {
    const service = TestBed.inject(AuthService);
    expect(await service.register('Ana', 'ana@example.com', 'password123')).toEqual({ success: true });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable');
    });

    service.logout();

    expect(setItem).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.sessionNotice()).toContain('no se pudo actualizar el almacenamiento');
  });

  it('updates and persists the signed-in user profile', async () => {
    const service = TestBed.inject(AuthService);
    await service.register('Ana', 'ana@example.com', 'password123');

    expect(
      service.updateProfile({
        name: 'Ana María',
        weightKg: 64.5,
        heightCm: 168,
        goal: 'Ganar fuerza',
      }),
    ).toEqual({ success: true });

    expect(service.currentUser()).toEqual({
      name: 'Ana María',
      email: 'ana@example.com',
      weightKg: 64.5,
      heightCm: 168,
      goal: 'Ganar fuerza',
    });
    const stored = JSON.parse(window.localStorage.getItem('fittrack.auth') ?? '{}');
    expect(stored.accounts[0]).toMatchObject({
      name: 'Ana María',
      weightKg: 64.5,
      heightCm: 168,
      goal: 'Ganar fuerza',
    });
  });
});
