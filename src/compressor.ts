import type { CompressionOptions, CompressionResult, ImageFile } from './types';

export async function compressImage(
  imageFile: ImageFile,
  options: CompressionOptions
): Promise<CompressionResult> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const img = await loadImage(imageFile.originalUrl);

  let { width, height } = imageFile;

  // Apply percentage resize
  if (options.percentageResize && options.percentageResize < 100) {
    const ratio = options.percentageResize / 100;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Apply target dimensions
  if (options.targetWidth || options.targetHeight) {
    if (options.maintainAspectRatio) {
      if (options.targetWidth && !options.targetHeight) {
        const ratio = options.targetWidth / width;
        width = options.targetWidth;
        height = Math.round(height * ratio);
      } else if (options.targetHeight && !options.targetWidth) {
        const ratio = options.targetHeight / height;
        height = options.targetHeight;
        width = Math.round(width * ratio);
      } else if (options.targetWidth && options.targetHeight) {
        const scale = Math.min(options.targetWidth / width, options.targetHeight / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
    } else {
      if (options.targetWidth) width = options.targetWidth;
      if (options.targetHeight) height = options.targetHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let outputFormat = resolveOutputFormat(imageFile.originalType, options.outputFormat);

  // CRITICAL FIX: PNG does not support quality-based compression via canvas.toBlob.
  // If the user requests quality < 100 and the output would be PNG, auto-convert
  // to WebP for actual compression. Otherwise the output would be identical to input.
  const isLosslessFormat = outputFormat === 'image/png';
  const wantsCompression = options.quality < 100;

  if (isLosslessFormat && wantsCompression) {
    // Try WebP first (best compression), fallback to JPEG
    const canWebP = await canEncodeFormat('image/webp');
    outputFormat = canWebP ? 'image/webp' : 'image/jpeg';
  }

  const supportsTransparency = outputFormat === 'image/png' || outputFormat === 'image/webp' || outputFormat === 'image/avif';

  if (!supportsTransparency) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const quality = options.quality / 100;
  const blob = await canvasToBlob(canvas, outputFormat, quality);

  if (!blob) {
    throw new Error('Compression failed: could not generate blob');
  }

  const url = URL.createObjectURL(blob);

  return {
    url,
    size: blob.size,
    type: outputFormat,
    width,
    height,
  };
}

function resolveOutputFormat(originalType: string, requested: string): string {
  if (requested === 'original') return originalType;
  if (requested === 'jpeg') return 'image/jpeg';
  if (requested === 'png') return 'image/png';
  if (requested === 'webp') return 'image/webp';
  if (requested === 'avif') return 'image/avif';
  return originalType;
}

async function canEncodeFormat(mimeType: string): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob !== null && blob.type === mimeType);
    }, mimeType, 0.5);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export function revokeImageUrl(url: string): void {
  URL.revokeObjectURL(url);
}
