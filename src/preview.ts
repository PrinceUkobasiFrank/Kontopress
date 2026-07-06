import type { ImageFile } from './types';
import { calculateSavings, formatBytes, formatResolution } from './utils';

export function renderPreview(
  container: HTMLElement,
  image: ImageFile
): { update: (image: ImageFile) => void; destroy: () => void } {
  const wrapper = document.createElement('div');
  wrapper.className = 'preview';

  const header = document.createElement('div');
  header.className = 'preview__header';
  header.innerHTML = `
    <h2 class="preview__title">${escapeHtml(image.name)}</h2>
    <span class="preview__badge preview__badge--${image.status}">${image.status}</span>
  `;

  const comparison = document.createElement('div');
  comparison.className = 'preview__comparison';

  const originalPanel = createImagePanel('Original', image.originalUrl, image.originalSize, image.width, image.height);
  const arrow = document.createElement('div');
  arrow.className = 'preview__arrow';
  arrow.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  arrow.setAttribute('aria-hidden', 'true');

  const compressedPanel = document.createElement('div');
  compressedPanel.className = 'preview__panel preview__panel--compressed';
  compressedPanel.id = `compressed-panel-${image.id}`;

  comparison.appendChild(originalPanel);
  comparison.appendChild(arrow);
  comparison.appendChild(compressedPanel);

  const stats = document.createElement('div');
  stats.className = 'preview__stats';
  stats.id = `stats-${image.id}`;

  wrapper.appendChild(header);
  wrapper.appendChild(comparison);
  wrapper.appendChild(stats);
  container.appendChild(wrapper);

  updateStats(image);
  updateCompressed(image);

  return {
    update: (updatedImage) => {
      const badge = header.querySelector('.preview__badge');
      if (badge) {
        badge.className = `preview__badge preview__badge--${updatedImage.status}`;
        badge.textContent = updatedImage.status;
      }
      updateCompressed(updatedImage);
      updateStats(updatedImage);
    },
    destroy: () => wrapper.remove(),
  };

  function updateCompressed(img: ImageFile): void {
    const panel = document.getElementById(`compressed-panel-${img.id}`);
    if (!panel) return;

    if (img.compressedUrl) {
      const savings = img.compressedSize !== null
        ? calculateSavings(img.originalSize, img.compressedSize)
        : null;

      panel.innerHTML = `
        <div class="preview__image-wrap">
          <img src="${img.compressedUrl}" alt="Compressed version of ${escapeHtml(img.name)}" loading="lazy">
        </div>
        <div class="preview__panel-info">
          <span class="preview__panel-label">Compressed</span>
          ${savings ? `<span class="preview__savings">-${savings.percentage}%</span>` : ''}
        </div>
      `;
    } else if (img.status === 'compressing') {
      panel.innerHTML = `
        <div class="preview__placeholder preview__placeholder--loading">
          <div class="spinner" aria-hidden="true"></div>
          <span>Compressing...</span>
        </div>
      `;
    } else if (img.status === 'error') {
      panel.innerHTML = `
        <div class="preview__placeholder preview__placeholder--error">
          <span>Compression failed</span>
          ${img.errorMessage ? `<span class="preview__error-msg">${escapeHtml(img.errorMessage)}</span>` : ''}
        </div>
      `;
    } else {
      panel.innerHTML = `
        <div class="preview__placeholder">
          <span>Adjust settings to compress</span>
        </div>
      `;
    }
  }

  function updateStats(img: ImageFile): void {
    const el = document.getElementById(`stats-${img.id}`);
    if (!el) return;

    const savings = img.compressedSize !== null
      ? calculateSavings(img.originalSize, img.compressedSize)
      : null;

    el.innerHTML = `
      <div class="stat">
        <span class="stat__label">Original</span>
        <span class="stat__value">${formatBytes(img.originalSize)}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Compressed</span>
        <span class="stat__value">${img.compressedSize !== null ? formatBytes(img.compressedSize) : '—'}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Saved</span>
        <span class="stat__value ${savings && savings.saved > 0 ? 'stat__value--positive' : ''}">
          ${savings ? `${formatBytes(savings.saved)} (${savings.percentage}%)` : '—'}
        </span>
      </div>
      <div class="stat">
        <span class="stat__label">Resolution</span>
        <span class="stat__value">${img.compressedWidth && img.compressedHeight ? formatResolution(img.compressedWidth, img.compressedHeight) : formatResolution(img.width, img.height)}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Format</span>
        <span class="stat__value">${img.compressedType ? img.compressedType.replace('image/', '').toUpperCase() : img.originalType.replace('image/', '').toUpperCase()}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Quality</span>
        <span class="stat__value">${img.quality}%</span>
      </div>
    `;
  }
}

function createImagePanel(
  label: string,
  src: string,
  size: number,
  width: number,
  height: number
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'preview__panel';
  panel.innerHTML = `
    <div class="preview__image-wrap">
      <img src="${src}" alt="${label} version" loading="lazy">
    </div>
    <div class="preview__panel-info">
      <span class="preview__panel-label">${label}</span>
      <span class="preview__panel-meta">${formatBytes(size)} x ${formatResolution(width, height)}</span>
    </div>
  `;
  return panel;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
