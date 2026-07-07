import type { AppState, ImageFile, OutputFormat } from './types';
import { APP_NAME, APP_TAGLINE, PRIVACY_MESSAGE, QUALITY_PRESETS } from './constants';
import { compressImage, revokeImageUrl } from './compressor';
import { downloadAllAsZip, downloadImage } from './imageExporter';
import { loadImageFiles } from './imageLoader';
import { notify } from './notifications';
import { renderPreview } from './preview';
import { createQualitySlider } from './quality';
import { createResizePanel, type ResizeState } from './resize';
import { getStoredOutputFormat, getStoredQuality, getStoredSidebarOpen, setStoredOutputFormat, setStoredQuality, setStoredSidebarOpen } from './storage';
import { initTheme, toggleTheme } from './theme';
import { debounce, formatBytes } from './utils';
import { initDragDrop } from './dragDrop';

let state: AppState = {
  images: [],
  selectedImageId: null,
  globalQuality: getStoredQuality(),
  globalOutputFormat: getStoredOutputFormat(),
  theme: 'system',
  isBatchMode: false,
  sidebarOpen: getStoredSidebarOpen(),
};

let previewInstance: ReturnType<typeof renderPreview> | null = null;
let qualitySlider: ReturnType<typeof createQualitySlider> | null = null;
let resizePanel: ReturnType<typeof createResizePanel> | null = null;
let dragDropCleanup: (() => void) | null = null;

const app = document.getElementById('app');
if (!app) throw new Error('App container not found');

export function initApp(): void {
  initTheme();
  renderApp();
}

function renderApp(): void {
  app!.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'app-root';

  // Header
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="app-header__brand">
      <img src="/images/logo.png" alt="" class="app-header__logo" width="32" height="32">
      <div class="app-header__text">
        <h1 class="app-header__title">${APP_NAME}</h1>
        <span class="app-header__tagline">${APP_TAGLINE}</span>
      </div>
    </div>
    <div class="app-header__actions">
      <button class="app-header__btn app-header__btn--theme" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
      <button class="app-header__btn app-header__btn--sidebar" id="sidebar-toggle" aria-label="Toggle sidebar" title="Toggle sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  `;

  // Main layout
  const main = document.createElement('main');
  main.className = 'app-main';

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = `app-sidebar ${state.sidebarOpen ? '' : 'app-sidebar--collapsed'}`;
  sidebar.id = 'app-sidebar';

  const sidebarContent = document.createElement('div');
  sidebarContent.className = 'app-sidebar__content';

  // Upload area
  const uploadArea = createUploadArea();

  // Settings
  const settingsSection = document.createElement('div');
  settingsSection.className = 'settings-section';

  const settingsTitle = document.createElement('h3');
  settingsTitle.className = 'settings-section__title';
  settingsTitle.textContent = 'Settings';
  settingsSection.appendChild(settingsTitle);

  // Quality slider
  const qualityContainer = document.createElement('div');
  qualityContainer.className = 'settings-section__item';
  settingsSection.appendChild(qualityContainer);

  qualitySlider = createQualitySlider(qualityContainer, state.globalQuality, (value) => {
    state.globalQuality = value;
    setStoredQuality(value);
    updateFormatNotice();
    if (state.selectedImageId) {
      const img = state.images.find((i) => i.id === state.selectedImageId);
      if (img) {
        img.quality = value;
        triggerCompression(img);
      }
    }
  });

  // Quality presets
  const presetsContainer = document.createElement('div');
  presetsContainer.className = 'quality-presets';
  for (const preset of QUALITY_PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'quality-preset';
    btn.type = 'button';
    btn.innerHTML = `
      <span class="quality-preset__label">${preset.label}</span>
      <span class="quality-preset__desc">${preset.description}</span>
    `;
    btn.addEventListener('click', () => {
      qualitySlider?.setValue(preset.value);
    });
    presetsContainer.appendChild(btn);
  }
  settingsSection.appendChild(presetsContainer);

  // Output format
  const formatSection = document.createElement('div');
  formatSection.className = 'settings-section__item';
  formatSection.innerHTML = `
    <label class="settings-section__label">Output Format</label>
    <div class="format-select">
      <button class="format-select__option ${state.globalOutputFormat === 'original' ? 'format-select__option--active' : ''}" data-format="original">Original</button>
      <button class="format-select__option ${state.globalOutputFormat === 'jpeg' ? 'format-select__option--active' : ''}" data-format="jpeg">JPEG</button>
      <button class="format-select__option ${state.globalOutputFormat === 'png' ? 'format-select__option--active' : ''}" data-format="png">PNG</button>
      <button class="format-select__option ${state.globalOutputFormat === 'webp' ? 'format-select__option--active' : ''}" data-format="webp">WebP</button>
      <button class="format-select__option ${state.globalOutputFormat === 'avif' ? 'format-select__option--active' : ''}" data-format="avif">AVIF</button>
    </div>
  `;
  settingsSection.appendChild(formatSection);

  // Format notice
  const formatNotice = document.createElement('div');
  formatNotice.className = 'format-notice';
  formatNotice.style.cssText = 'font-size:11px;color:var(--text-tertiary);margin-top:6px;line-height:1.4;';
  formatSection.appendChild(formatNotice);

  function updateFormatNotice(): void {
    const selected = state.globalOutputFormat;
    const img = state.selectedImageId ? state.images.find((i) => i.id === state.selectedImageId) : null;
    const effectiveFormat = selected === 'original' ? (img?.originalType || 'image/png') : selected;
    const isPng = effectiveFormat === 'image/png' || effectiveFormat === 'png';
    if (isPng && state.globalQuality < 100) {
      formatNotice.textContent = 'PNG does not support quality compression. Output will be converted to WebP for size reduction.';
    } else {
      formatNotice.textContent = '';
    }
  }

  formatSection.querySelectorAll('.format-select__option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format') as OutputFormat;
      state.globalOutputFormat = format;
      setStoredOutputFormat(format);
      formatSection.querySelectorAll('.format-select__option').forEach((b) => b.classList.remove('format-select__option--active'));
      btn.classList.add('format-select__option--active');
      updateFormatNotice();
      if (state.selectedImageId) {
        const img = state.images.find((i) => i.id === state.selectedImageId);
        if (img) {
          img.outputFormat = format;
          triggerCompression(img);
        }
      }
    });
  });

  // Resize panel container
  const resizeContainer = document.createElement('div');
  resizeContainer.className = 'settings-section__item';
  settingsSection.appendChild(resizeContainer);

  sidebarContent.appendChild(uploadArea);
  sidebarContent.appendChild(settingsSection);
  sidebar.appendChild(sidebarContent);

  // Content area
  const content = document.createElement('div');
  content.className = 'app-content';
  content.id = 'app-content';

  main.appendChild(sidebar);
  main.appendChild(content);

  // Footer
  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  footer.innerHTML = `
    <span class="app-footer__privacy">${PRIVACY_MESSAGE}</span>
    <span class="app-footer__version">v1.0.0</span>
  `;

  root.appendChild(header);
  root.appendChild(main);
  root.appendChild(footer);
  app!.appendChild(root);

  // Event bindings
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    setStoredSidebarOpen(state.sidebarOpen);
    sidebar.classList.toggle('app-sidebar--collapsed', !state.sidebarOpen);
  });

  // Drag & drop
  if (dragDropCleanup) dragDropCleanup();
  dragDropCleanup = initDragDrop(document.body, {
    onDrop: handleFiles,
    onDragEnter: () => document.body.classList.add('drag-active'),
    onDragLeave: () => document.body.classList.remove('drag-active'),
  });

  // Render state
  if (state.images.length === 0) {
    renderEmptyState(content);
  } else {
    renderImageList(content);
    if (state.selectedImageId) {
      const selected = state.images.find((i) => i.id === state.selectedImageId);
      if (selected) renderImageDetail(content, selected);
    }
  }
}

function createUploadArea(): HTMLElement {
  const area = document.createElement('div');
  area.className = 'upload-area';
  area.innerHTML = `
    <input type="file" id="file-input" class="upload-area__input" accept="image/jpeg,image/png,image/webp,image/avif" multiple aria-label="Upload images">
    <label for="file-input" class="upload-area__zone">
      <svg class="upload-area__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <span class="upload-area__title">Drop images here</span>
      <span class="upload-area__hint">or click to browse x Ctrl+V to paste</span>
      <span class="upload-area__formats">JPEG x PNG x WebP x AVIF</span>
    </label>
  `;

  const input = area.querySelector('#file-input') as HTMLInputElement;
  input.addEventListener('change', () => {
    if (input.files) handleFiles(input.files);
    input.value = '';
  });

  return area;
}

function renderEmptyState(container: HTMLElement): void {
  container.innerHTML = '';
  container.className = 'app-content app-content--empty';

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-state__illustration">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
    <h2 class="empty-state__title">Ready to compress</h2>
    <p class="empty-state__subtitle">Drop images, browse files, or paste from clipboard</p>
    <div class="empty-state__actions">
      <button class="btn btn--primary" id="empty-browse">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Browse Files
      </button>
    </div>
    <p class="empty-state__privacy">${PRIVACY_MESSAGE}</p>
  `;

  container.appendChild(empty);

  const browseBtn = empty.querySelector('#empty-browse') as HTMLButtonElement;
  browseBtn.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });
}

function renderImageList(container: HTMLElement): void {
  const list = document.createElement('div');
  list.className = 'image-list';

  const header = document.createElement('div');
  header.className = 'image-list__header';
  header.innerHTML = `
    <span class="image-list__count">${state.images.length} image${state.images.length !== 1 ? 's' : ''}</span>
    <div class="image-list__actions">
      <button class="btn btn--ghost btn--sm" id="compress-all">Compress All</button>
      <button class="btn btn--ghost btn--sm" id="download-all">Download All</button>
      <button class="btn btn--ghost btn--sm btn--danger" id="clear-all">Clear</button>
    </div>
  `;

  const items = document.createElement('div');
  items.className = 'image-list__items';

  for (const image of state.images) {
    const item = document.createElement('button');
    item.className = `image-list__item ${image.id === state.selectedImageId ? 'image-list__item--active' : ''}`;
    item.type = 'button';
    item.setAttribute('aria-selected', String(image.id === state.selectedImageId));

    const savings = image.compressedSize !== null
      ? Math.max(0, Math.round(((image.originalSize - image.compressedSize) / image.originalSize) * 100))
      : null;

    item.innerHTML = `
      <img src="${image.originalUrl}" alt="" class="image-list__thumb" loading="lazy">
      <div class="image-list__info">
        <span class="image-list__name">${escapeHtml(image.name)}</span>
        <span class="image-list__meta">${formatBytes(image.originalSize)}${savings !== null ? ` x ${formatBytes(image.compressedSize!)}` : ''}</span>
      </div>
      ${savings !== null ? `<span class="image-list__badge">-${savings}%</span>` : ''}
      ${image.status === 'compressing' ? '<span class="image-list__spinner" aria-hidden="true"></span>' : ''}
    `;

    item.addEventListener('click', () => selectImage(image.id));
    items.appendChild(item);
  }

  list.appendChild(header);
  list.appendChild(items);

  const existing = container.querySelector('.image-list');
  if (existing) existing.replaceWith(list);
  else container.insertBefore(list, container.firstChild);

  document.getElementById('compress-all')?.addEventListener('click', compressAll);
  document.getElementById('download-all')?.addEventListener('click', () => downloadAllAsZip(state.images));
  document.getElementById('clear-all')?.addEventListener('click', clearAll);
}

function renderImageDetail(container: HTMLElement, image: ImageFile): void {
  container.querySelector('.image-detail')?.remove();

  const detail = document.createElement('div');
  detail.className = 'image-detail';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'image-detail__toolbar';
  toolbar.innerHTML = `
    <button class="btn btn--primary" id="download-single">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download
    </button>
    <button class="btn btn--ghost" id="remove-image">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      Remove
    </button>
  `;
  detail.appendChild(toolbar);

  // Preview
  const previewContainer = document.createElement('div');
  previewContainer.className = 'image-detail__preview';
  detail.appendChild(previewContainer);

  previewInstance = renderPreview(previewContainer, image);

  // Per-image settings
  const perImageSettings = document.createElement('div');
  perImageSettings.className = 'image-detail__settings';

  // Quality override
  const qualityOverride = document.createElement('div');
  qualityOverride.className = 'image-detail__setting';
  qualityOverride.innerHTML = `
    <label class="image-detail__setting-label">Quality Override</label>
    <input type="range" class="image-detail__quality-override" min="10" max="100" value="${image.quality}">
    <span class="image-detail__quality-value">${image.quality}%</span>
  `;
  const qualityInput = qualityOverride.querySelector('.image-detail__quality-override') as HTMLInputElement;
  const qualityValue = qualityOverride.querySelector('.image-detail__quality-value') as HTMLSpanElement;
  qualityInput.addEventListener('input', () => {
    const val = parseInt(qualityInput.value, 10);
    image.quality = val;
    qualityValue.textContent = `${val}%`;
    debouncedCompress(image);
  });
  perImageSettings.appendChild(qualityOverride);

  // Resize panel
  const resizeContainer = document.createElement('div');
  resizeContainer.className = 'image-detail__setting';
  perImageSettings.appendChild(resizeContainer);

  resizePanel = createResizePanel(resizeContainer, image, (resizeState: ResizeState) => {
    image.maintainAspectRatio = resizeState.maintainAspectRatio;
    image.targetWidth = resizeState.targetWidth;
    image.targetHeight = resizeState.targetHeight;
    image.percentageResize = resizeState.percentage;
    triggerCompression(image);
  });

  detail.appendChild(perImageSettings);
  container.appendChild(detail);

  document.getElementById('download-single')?.addEventListener('click', () => {
    if (image.status === 'done' && image.compressedUrl) {
      downloadImage(image);
      notify(`Downloaded ${image.name}`, 'success');
    } else {
      notify('Compress the image first', 'info');
    }
  });

  document.getElementById('remove-image')?.addEventListener('click', () => {
    removeImage(image.id);
  });
}

async function handleFiles(files: FileList): Promise<void> {
  const images = await loadImageFiles(files);
  if (images.length === 0) return;

  for (const image of images) {
    image.quality = state.globalQuality;
    image.outputFormat = state.globalOutputFormat;
    state.images.push(image);
  }

  if (state.images.length > 0 && !state.selectedImageId) {
    state.selectedImageId = state.images[0].id;
  }

  renderApp();
  notify(`Added ${images.length} image${images.length !== 1 ? 's' : ''}`, 'success');

  // Auto-compress first image
  if (state.selectedImageId) {
    const first = state.images.find((i) => i.id === state.selectedImageId);
    if (first) await triggerCompression(first);
  }
}

function selectImage(id: string): void {
  state.selectedImageId = id;
  const content = document.getElementById('app-content');
  if (!content) return;

  // Update list active state
  document.querySelectorAll('.image-list__item').forEach((el) => {
    el.classList.toggle('image-list__item--active', el.getAttribute('data-id') === id);
  });

  const image = state.images.find((i) => i.id === id);
  if (image) {
    renderImageDetail(content, image);
    if (image.status === 'pending') {
      triggerCompression(image);
    }
  }
}

async function triggerCompression(image: ImageFile): Promise<void> {
  if (image.status === 'compressing') return;

  // Clean up previous compressed URL
  if (image.compressedUrl) {
    revokeImageUrl(image.compressedUrl);
    image.compressedUrl = null;
    image.compressedSize = null;
    image.compressedType = null;
    image.compressedWidth = null;
    image.compressedHeight = null;
  }

  image.status = 'compressing';
  image.errorMessage = null;
  previewInstance?.update(image);
  updateListItem(image);

  try {
    const result = await compressImage(image, {
      quality: image.quality,
      targetWidth: image.targetWidth,
      targetHeight: image.targetHeight,
      maintainAspectRatio: image.maintainAspectRatio,
      percentageResize: image.percentageResize,
      outputFormat: image.outputFormat,
    });

    image.compressedUrl = result.url;
    image.compressedSize = result.size;
    image.compressedType = result.type;
    image.compressedWidth = result.width;
    image.compressedHeight = result.height;
    image.status = 'done';

    previewInstance?.update(image);
    updateListItem(image);
  } catch (err) {
    image.status = 'error';
    image.errorMessage = err instanceof Error ? err.message : 'Unknown error';
    previewInstance?.update(image);
    updateListItem(image);
    notify(`Failed to compress ${image.name}`, 'error');
  }
}

const debouncedCompress = debounce((image: ImageFile) => {
  triggerCompression(image);
}, 300);

function updateListItem(image: ImageFile): void {
  const content = document.getElementById('app-content');
  if (!content) return;
  renderImageList(content);
}

async function compressAll(): Promise<void> {
  const pending = state.images.filter((i) => i.status === 'pending');
  if (pending.length === 0) {
    notify('All images are already compressed', 'info');
    return;
  }

  for (const image of pending) {
    await triggerCompression(image);
  }

  notify(`Compressed ${pending.length} image${pending.length !== 1 ? 's' : ''}`, 'success');
}

function removeImage(id: string): void {
  const index = state.images.findIndex((i) => i.id === id);
  if (index === -1) return;

  const image = state.images[index];
  if (image.compressedUrl) revokeImageUrl(image.compressedUrl);
  URL.revokeObjectURL(image.originalUrl);

  state.images.splice(index, 1);

  if (state.selectedImageId === id) {
    state.selectedImageId = state.images.length > 0 ? state.images[0].id : null;
  }

  renderApp();
}

function clearAll(): void {
  for (const image of state.images) {
    if (image.compressedUrl) revokeImageUrl(image.compressedUrl);
    URL.revokeObjectURL(image.originalUrl);
  }

  state.images = [];
  state.selectedImageId = null;
  renderApp();
  notify('All images cleared', 'info');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
