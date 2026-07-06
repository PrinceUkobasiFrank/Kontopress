import { getStoredTheme, setStoredTheme } from './storage';
import type { Theme } from './types';

let currentTheme: Theme = getStoredTheme();

export function initTheme(): void {
  applyTheme(currentTheme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') applyTheme('system');
  });
}

export function getTheme(): Theme {
  return currentTheme;
}

export function setTheme(theme: Theme): void {
  currentTheme = theme;
  setStoredTheme(theme);
  applyTheme(theme);
}

export function toggleTheme(): void {
  const resolved = resolveTheme(currentTheme);
  setTheme(resolved === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}
