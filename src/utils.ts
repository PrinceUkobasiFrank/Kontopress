import { APP_NAME } from './constants';

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
  return `${value} ${sizes[i]}`;
}

export function formatResolution(width: number, height: number): string {
  return `${width.toLocaleString()} x ${height.toLocaleString()}`;
}

export function calculateSavings(original: number, compressed: number): {
  percentage: number;
  saved: number;
} {
  if (original === 0) return { percentage: 0, saved: 0 };
  const saved = original - compressed;
  const percentage = Math.max(0, Math.round((saved / original) * 100));
  return { percentage, saved };
}

export function generateFilename(originalName: string, format: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  const ext = format.replace('image/', '');
  const cleanBase = base.replace(/[^a-zA-Z0-9\-_\s]/g, '').trim() || 'image';
  return `${cleanBase}-${APP_NAME.toLowerCase()}.${ext}`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isSupportedImageType(type: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(type);
}

export function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  return map[mime] || 'jpg';
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
