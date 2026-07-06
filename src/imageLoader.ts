import { MAX_FILE_SIZE_BYTES } from './constants';
import { notify } from './notifications';
import type { ImageFile } from './types';
import { formatBytes, generateId, isSupportedImageType } from './utils';

export async function loadImageFile(file: File): Promise<ImageFile | null> {
  if (!isSupportedImageType(file.type)) {
    notify(`Unsupported file type: ${file.name}. Use JPEG, PNG, WebP, or AVIF.`, 'error');
    return null;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    notify(`File too large: ${file.name} (${formatBytes(file.size)}). Max is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`, 'error');
    return null;
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        id: generateId(),
        file,
        name: file.name,
        originalSize: file.size,
        originalType: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        originalUrl: url,
        compressedUrl: null,
        compressedSize: null,
        compressedType: null,
        compressedWidth: null,
        compressedHeight: null,
        status: 'pending',
        errorMessage: null,
        quality: 80,
        targetWidth: null,
        targetHeight: null,
        maintainAspectRatio: true,
        percentageResize: null,
        outputFormat: 'original',
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      notify(`Failed to load image: ${file.name}`, 'error');
      resolve(null);
    };

    img.src = url;
  });
}

export async function loadImageFiles(files: FileList | File[]): Promise<ImageFile[]> {
  const results = await Promise.all(Array.from(files).map(loadImageFile));
  return results.filter((img): img is ImageFile => img !== null);
}
