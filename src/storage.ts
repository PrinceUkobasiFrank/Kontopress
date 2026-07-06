import { STORAGE_KEYS } from './constants';
import type { Theme, OutputFormat } from './types';

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* ignore */ }
  return 'system';
}

export function setStoredTheme(theme: Theme): void {
  try { localStorage.setItem(STORAGE_KEYS.THEME, theme); } catch { /* ignore */ }
}

export function getStoredQuality(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUALITY);
    if (stored) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 10 && val <= 100) return val;
    }
  } catch { /* ignore */ }
  return 80;
}

export function setStoredQuality(quality: number): void {
  try { localStorage.setItem(STORAGE_KEYS.QUALITY, String(quality)); } catch { /* ignore */ }
}

export function getStoredOutputFormat(): OutputFormat {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OUTPUT_FORMAT) as OutputFormat | null;
    if (stored && ['original', 'jpeg', 'png', 'webp', 'avif'].includes(stored)) return stored;
  } catch { /* ignore */ }
  return 'original';
}

export function setStoredOutputFormat(format: OutputFormat): void {
  try { localStorage.setItem(STORAGE_KEYS.OUTPUT_FORMAT, format); } catch { /* ignore */ }
}

export function getStoredSidebarOpen(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
    return stored !== 'false';
  } catch { /* ignore */ }
  return true;
}

export function setStoredSidebarOpen(open: boolean): void {
  try { localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(open)); } catch { /* ignore */ }
}
