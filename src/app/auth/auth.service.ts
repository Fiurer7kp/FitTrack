import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AuthUser {
  name: string;
  email: string;
  weightKg?: number | null;
  heightCm?: number | null;
  goal?: string;
}

interface StoredAccount extends AuthUser {
  salt: string;
  passwordHash: string;
}

interface AuthState {
  accounts: StoredAccount[];
  activeEmail: string | null;
}

export type RegistrationResult =
  | { success: true }
  | { success: false; reason: 'email-in-use' | 'storage-unavailable' | 'crypto-unavailable' };
export type LoginResult =
  | { success: true }
  | { success: false; reason: 'invalid-credentials' | 'storage-unavailable' | 'crypto-unavailable' };
export type ProfileUpdateResult =
  | { success: true }
  | { success: false; reason: 'unauthenticated' | 'storage-unavailable' };

const STORAGE_KEY = 'fittrack.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageUnavailable = signal(false);
  private readonly state = signal<AuthState>(this.readInitialState());
  readonly sessionNotice = signal<string | null>(null);

  readonly currentUser = computed(() => {
    const state = this.state();
    const account = state.accounts.find(({ email }) => email === state.activeEmail);
    return account
      ? {
          name: account.name,
          email: account.email,
          ...(account.weightKg !== undefined ? { weightKg: account.weightKg } : {}),
          ...(account.heightCm !== undefined ? { heightCm: account.heightCm } : {}),
          ...(account.goal !== undefined ? { goal: account.goal } : {}),
        }
      : null;
  });
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  async register(name: string, email: string, password: string): Promise<RegistrationResult> {
    if (!isPlatformBrowser(this.platformId) || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    let currentState: AuthState;
    try {
      currentState = this.readState();
    } catch (error) {
      if (error instanceof AuthStorageError) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (currentState.accounts.some(({ email: accountEmail }) => accountEmail === normalizedEmail)) {
      return { success: false, reason: 'email-in-use' };
    }

    let salt: Uint8Array<ArrayBuffer>;
    let passwordHash: string;
    try {
      salt = crypto.getRandomValues(new Uint8Array(16));
      passwordHash = await this.hashPassword(password, salt);
    } catch {
      return { success: false, reason: 'crypto-unavailable' };
    }

    const account: StoredAccount = {
      name: name.trim(),
      email: normalizedEmail,
      salt: this.toHex(salt),
      passwordHash,
    };
    const nextState: AuthState = {
      accounts: [...currentState.accounts, account],
      activeEmail: normalizedEmail,
    };

    try {
      this.persist(nextState);
    } catch (error) {
      if (error instanceof AuthStorageError) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }
      throw error;
    }

    this.state.set(nextState);
    return { success: true };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    if (!isPlatformBrowser(this.platformId) || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    let currentState: AuthState;
    try {
      currentState = this.readState();
    } catch (error) {
      if (error instanceof AuthStorageError) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const account = currentState.accounts.find(({ email: accountEmail }) => accountEmail === normalizedEmail);
    if (!account) {
      return { success: false, reason: 'invalid-credentials' };
    }

    let passwordHash: string;
    try {
      passwordHash = await this.hashPassword(password, this.fromHex(account.salt));
    } catch {
      return { success: false, reason: 'crypto-unavailable' };
    }

    if (passwordHash !== account.passwordHash) {
      return { success: false, reason: 'invalid-credentials' };
    }

    const nextState: AuthState = { ...currentState, activeEmail: normalizedEmail };
    try {
      this.persist(nextState);
    } catch (error) {
      if (error instanceof AuthStorageError) {
        this.storageUnavailable.set(true);
        return { success: false, reason: 'storage-unavailable' };
      }
      throw error;
    }

    this.state.set(nextState);
    return { success: true };
  }

  logout(): void {
    this.state.update((state) => ({ ...state, activeEmail: null }));
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.storageUnavailable()) {
      this.sessionNotice.set('La sesión se cerró en esta pestaña, pero no se pudo actualizar el almacenamiento.');
      return;
    }

    try {
      this.persist({ ...this.readState(), activeEmail: null });
      this.sessionNotice.set(null);
    } catch (error) {
      if (!(error instanceof AuthStorageError)) {
        throw error;
      }
      this.storageUnavailable.set(true);
      this.sessionNotice.set('La sesión se cerró en esta pestaña, pero no se pudo actualizar el almacenamiento.');
    }
  }

  updateProfile(profile: Pick<AuthUser, 'name' | 'weightKg' | 'heightCm' | 'goal'>): ProfileUpdateResult {
    if (!isPlatformBrowser(this.platformId) || this.storageUnavailable()) {
      return { success: false, reason: 'storage-unavailable' };
    }

    const currentEmail = this.state().activeEmail;
    if (!currentEmail) {
      return { success: false, reason: 'unauthenticated' };
    }

    let currentState: AuthState;
    try {
      currentState = this.readState();
    } catch (error) {
      if (!(error instanceof AuthStorageError)) {
        throw error;
      }
      this.storageUnavailable.set(true);
      return { success: false, reason: 'storage-unavailable' };
    }

    if (!currentState.accounts.some(({ email }) => email === currentEmail)) {
      return { success: false, reason: 'unauthenticated' };
    }

    const nextState: AuthState = {
      ...currentState,
      accounts: currentState.accounts.map((account) =>
        account.email === currentEmail
          ? {
              ...account,
              name: profile.name.trim(),
              weightKg: profile.weightKg,
              heightCm: profile.heightCm,
              goal: profile.goal,
            }
          : account,
      ),
    };

    try {
      this.persist(nextState);
    } catch (error) {
      if (!(error instanceof AuthStorageError)) {
        throw error;
      }
      this.storageUnavailable.set(true);
      return { success: false, reason: 'storage-unavailable' };
    }

    this.state.set(nextState);
    return { success: true };
  }

  clearSessionNotice(): void {
    this.sessionNotice.set(null);
  }

  private async hashPassword(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 120_000 },
      key,
      256,
    );
    return this.toHex(new Uint8Array(bits));
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private fromHex(hex: string): Uint8Array<ArrayBuffer> {
    if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
      throw new AuthStorageError();
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }

  private readInitialState(): AuthState {
    if (!isPlatformBrowser(this.platformId)) {
      return { accounts: [], activeEmail: null };
    }

    try {
      return this.readState();
    } catch (error) {
      if (!(error instanceof AuthStorageError)) {
        throw error;
      }
      this.storageUnavailable.set(true);
      return { accounts: [], activeEmail: null };
    }
  }

  private readState(): AuthState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return { accounts: [], activeEmail: null };
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isAuthState(parsed)) {
        throw new AuthStorageError();
      }
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof DOMException) {
        throw new AuthStorageError();
      }
      throw error;
    }
  }

  private isAuthState(value: unknown): value is AuthState {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const record = value as Record<string, unknown>;
    return (
      Array.isArray(record['accounts']) &&
      record['accounts'].every((account: unknown) => this.isStoredAccount(account)) &&
      (record['activeEmail'] === null || typeof record['activeEmail'] === 'string')
    );
  }

  private isStoredAccount(value: unknown): value is StoredAccount {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const record = value as Record<string, unknown>;
    return (
      typeof record['name'] === 'string' &&
      typeof record['email'] === 'string' &&
      typeof record['salt'] === 'string' &&
      typeof record['passwordHash'] === 'string' &&
      (record['weightKg'] === undefined || record['weightKg'] === null ||
        (typeof record['weightKg'] === 'number' && record['weightKg'] > 0)) &&
      (record['heightCm'] === undefined || record['heightCm'] === null ||
        (typeof record['heightCm'] === 'number' && record['heightCm'] > 0)) &&
      (record['goal'] === undefined || typeof record['goal'] === 'string')
    );
  }

  private persist(state: AuthState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (error instanceof DOMException) {
        throw new AuthStorageError();
      }
      throw error;
    }
  }
}

class AuthStorageError extends Error {}
