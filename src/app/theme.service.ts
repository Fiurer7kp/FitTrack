import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'fittrack.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = signal<Theme>('dark');
  readonly storageUnavailable = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
      this.storageUnavailable.set(true);
    }
    this.apply(storedTheme === 'light' ? 'light' : 'dark');
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.storageUnavailable.set(false);
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }
      this.storageUnavailable.set(true);
    }
  }
}
