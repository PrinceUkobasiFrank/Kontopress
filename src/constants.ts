export const APP_NAME = 'Kontopress';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Compress images instantly. Private. Fast. Free.';
export const PRIVACY_MESSAGE = 'Images never leave your device.';

export const SUPPORTED_INPUT_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const SUPPORTED_EXTENSIONS: readonly string[] = [
  '.jpg', '.jpeg', '.png', '.webp', '.avif'
];

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const DEFAULT_QUALITY = 80;
export const MIN_QUALITY = 10;
export const MAX_QUALITY = 100;

export const DEFAULT_OUTPUT_FORMAT: import('./types').OutputFormat = 'original';

export const STORAGE_KEYS = {
  THEME: 'kontopress-theme',
  QUALITY: 'kontopress-quality',
  OUTPUT_FORMAT: 'kontopress-output-format',
  SIDEBAR_OPEN: 'kontopress-sidebar-open',
} as const;

export const ANIMATION_DURATION_MS = 200;
export const DEBOUNCE_MS = 150;

export const QUALITY_PRESETS = [
  { label: 'Low', value: 30, description: 'Smallest file, visible quality loss' },
  { label: 'Balanced', value: 60, description: 'Good balance of size and quality' },
  { label: 'High', value: 80, description: 'Minimal quality loss' },
  { label: 'Maximum', value: 95, description: 'Near-lossless compression' },
] as const;
