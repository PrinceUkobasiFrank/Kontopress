import type { ImageFile } from './types';
import { generateFilename } from './utils';

export function downloadImage(image: ImageFile): void {
  if (!image.compressedUrl || !image.compressedType) return;

  const a = document.createElement('a');
  a.href = image.compressedUrl;
  a.download = generateFilename(image.name, image.compressedType);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadAllAsZip(images: ImageFile[]): Promise<void> {
  const validImages = images.filter((img) => img.compressedUrl && img.compressedType);
  if (validImages.length === 0) return;

  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    for (const image of validImages) {
      if (!image.compressedUrl || !image.compressedType) continue;
      const response = await fetch(image.compressedUrl);
      const blob = await response.blob();
      const filename = generateFilename(image.name, image.compressedType);
      zip.file(filename, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontopress-batch-${Date.now()}.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    for (const image of validImages) {
      downloadImage(image);
    }
  }
}
