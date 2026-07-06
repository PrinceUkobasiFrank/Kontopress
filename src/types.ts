export interface ImageFile {
  readonly id: string;
  readonly file: File;
  readonly name: string;
  readonly originalSize: number;
  readonly originalType: string;
  readonly width: number;
  readonly height: number;
  readonly originalUrl: string;
  compressedUrl: string | null;
  compressedSize: number | null;
  compressedType: string | null;
  compressedWidth: number | null;
  compressedHeight: number | null;
  status: 'pending' | 'compressing' | 'done' | 'error';
  errorMessage: string | null;
  quality: number;
  targetWidth: number | null;
  targetHeight: number | null;
  maintainAspectRatio: boolean;
  percentageResize: number | null;
  outputFormat: OutputFormat;
}

export type OutputFormat = 'original' | 'jpeg' | 'png' | 'webp' | 'avif';
export type Theme = 'light' | 'dark' | 'system';

export interface CompressionOptions {
  quality: number;
  targetWidth: number | null;
  targetHeight: number | null;
  maintainAspectRatio: boolean;
  percentageResize: number | null;
  outputFormat: OutputFormat;
}

export interface CompressionResult {
  readonly url: string;
  readonly size: number;
  readonly type: string;
  readonly width: number;
  readonly height: number;
}

export interface AppState {
  images: ImageFile[];
  selectedImageId: string | null;
  globalQuality: number;
  globalOutputFormat: OutputFormat;
  theme: Theme;
  isBatchMode: boolean;
  sidebarOpen: boolean;
}

export interface Notification {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'info';
  readonly duration: number;
}
