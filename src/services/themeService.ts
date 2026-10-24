/**
 * InterviewIQ Theme Service
 *
 * Manages Light, Dark, and System appearance modes across the entire application.
 * Persists selection in localStorage and synchronizes with system preference changes.
 */

import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'interviewiq_theme_mode';

type ThemeListener = (theme: ThemeMode, isDark: boolean) => void;
const listeners = new Set<ThemeListener>();

/**
 * Returns whether system preference currently prefers dark mode.
 */
function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves whether the current mode evaluates to dark.
 */
export function isDarkActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return getSystemPrefersDark();
}

/**
 * Retrieves the saved theme mode from storage.
 */
export function getStoredTheme(): ThemeMode {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
  } catch (e) {
    console.warn('Unable to access localStorage for theme:', e);
  }
  return 'system';
}

/**
 * Applies the dark class to document.documentElement and notifies listeners.
 */
function applyThemeToDOM(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const isDark = isDarkActive(mode);
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  listeners.forEach((listener) => listener(mode, isDark));
}

/**
 * Updates and persists the user's theme selection.
 */
export function setTheme(mode: ThemeMode): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch (e) {
    console.warn('Unable to persist theme to localStorage:', e);
  }
  applyThemeToDOM(mode);
}

/**
 * Initializes theme on page load and registers system media query listeners.
 */
export function initTheme(): () => void {
  const currentMode = getStoredTheme();
  applyThemeToDOM(currentMode);

  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    if (getStoredTheme() === 'system') {
      applyThemeToDOM('system');
    }
  };

  try {
    mediaQuery.addEventListener('change', handleSystemChange);
  } catch (_e) {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemChange);
  }

  return () => {
    try {
      mediaQuery.removeEventListener('change', handleSystemChange);
    } catch (_e) {
      mediaQuery.removeListener(handleSystemChange);
    }
  };
}

/**
 * Subscribes to theme changes.
 */
export function subscribeToTheme(listener: ThemeListener): () => void {
  listeners.add(listener);
  listener(getStoredTheme(), isDarkActive(getStoredTheme()));
  return () => {
    listeners.delete(listener);
  };
}
