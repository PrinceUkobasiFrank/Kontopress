import type { ImageFile } from './types';

export interface ResizeState {
  enabled: boolean;
  maintainAspectRatio: boolean;
  targetWidth: number | null;
  targetHeight: number | null;
  percentage: number | null;
}

export function createResizePanel(
  container: HTMLElement,
  image: ImageFile,
  onChange: (state: ResizeState) => void
): { update: (state: ResizeState) => void; destroy: () => void } {
  const wrapper = document.createElement('div');
  wrapper.className = 'resize-panel';

  const header = document.createElement('div');
  header.className = 'resize-panel__header';
  header.innerHTML = `
    <span class="resize-panel__title">Resize</span>
    <label class="toggle">
      <input type="checkbox" class="toggle__input" ${image.percentageResize !== null || image.targetWidth !== null ? 'checked' : ''}>
      <span class="toggle__track">
        <span class="toggle__thumb"></span>
      </span>
    </label>
  `;

  const body = document.createElement('div');
  body.className = 'resize-panel__body';

  const aspectCheckbox = document.createElement('label');
  aspectCheckbox.className = 'checkbox';
  aspectCheckbox.innerHTML = `
    <input type="checkbox" class="checkbox__input" ${image.maintainAspectRatio ? 'checked' : ''}>
    <span class="checkbox__box"></span>
    <span class="checkbox__label">Maintain aspect ratio</span>
  `;

  const percentageRow = document.createElement('div');
  percentageRow.className = 'resize-panel__row';
  percentageRow.innerHTML = `
    <label class="resize-panel__field-label">Scale</label>
    <div class="resize-panel__input-wrap">
      <input type="number" class="resize-panel__input resize-panel__input--percentage" 
        value="${image.percentageResize ?? 100}" min="1" max="100" step="1">
      <span class="resize-panel__suffix">%</span>
    </div>
  `;

  const dimensionsRow = document.createElement('div');
  dimensionsRow.className = 'resize-panel__row resize-panel__row--dimensions';
  dimensionsRow.innerHTML = `
    <div class="resize-panel__dimension">
      <label class="resize-panel__field-label">Width</label>
      <input type="number" class="resize-panel__input resize-panel__input--width" 
        value="${image.targetWidth ?? image.width}" min="1">
    </div>
    <span class="resize-panel__separator">x</span>
    <div class="resize-panel__dimension">
      <label class="resize-panel__field-label">Height</label>
      <input type="number" class="resize-panel__input resize-panel__input--height" 
        value="${image.targetHeight ?? image.height}" min="1">
    </div>
  `;

  body.appendChild(aspectCheckbox);
  body.appendChild(percentageRow);
  body.appendChild(dimensionsRow);
  wrapper.appendChild(header);
  wrapper.appendChild(body);
  container.appendChild(wrapper);

  const toggleInput = header.querySelector('.toggle__input') as HTMLInputElement;
  const aspectInput = aspectCheckbox.querySelector('.checkbox__input') as HTMLInputElement;
  const percentageInput = percentageRow.querySelector('.resize-panel__input--percentage') as HTMLInputElement;
  const widthInput = dimensionsRow.querySelector('.resize-panel__input--width') as HTMLInputElement;
  const heightInput = dimensionsRow.querySelector('.resize-panel__input--height') as HTMLInputElement;

  const getState = (): ResizeState => ({
    enabled: toggleInput.checked,
    maintainAspectRatio: aspectInput.checked,
    targetWidth: toggleInput.checked && !percentageInput.value ? parseInt(widthInput.value, 10) || null : null,
    targetHeight: toggleInput.checked && !percentageInput.value ? parseInt(heightInput.value, 10) || null : null,
    percentage: toggleInput.checked && percentageInput.value ? parseInt(percentageInput.value, 10) || null : null,
  });

  const emit = () => onChange(getState());

  toggleInput.addEventListener('change', () => {
    body.classList.toggle('resize-panel__body--disabled', !toggleInput.checked);
    emit();
  });

  aspectInput.addEventListener('change', emit);

  percentageInput.addEventListener('input', () => {
    const val = parseInt(percentageInput.value, 10);
    if (val > 0 && val <= 100) {
      widthInput.value = String(Math.round(image.width * (val / 100)));
      heightInput.value = String(Math.round(image.height * (val / 100)));
    }
    emit();
  });

  widthInput.addEventListener('input', () => {
    if (aspectInput.checked) {
      const val = parseInt(widthInput.value, 10);
      if (val > 0) {
        heightInput.value = String(Math.round(val / (image.width / image.height)));
        percentageInput.value = String(Math.round((val / image.width) * 100));
      }
    }
    emit();
  });

  heightInput.addEventListener('input', () => {
    if (aspectInput.checked) {
      const val = parseInt(heightInput.value, 10);
      if (val > 0) {
        widthInput.value = String(Math.round(val * (image.width / image.height)));
        percentageInput.value = String(Math.round((val / image.height) * 100));
      }
    }
    emit();
  });

  if (!toggleInput.checked) {
    body.classList.add('resize-panel__body--disabled');
  }

  return {
    update: (state) => {
      toggleInput.checked = state.enabled;
      aspectInput.checked = state.maintainAspectRatio;
      if (state.percentage) percentageInput.value = String(state.percentage);
      if (state.targetWidth) widthInput.value = String(state.targetWidth);
      if (state.targetHeight) heightInput.value = String(state.targetHeight);
      body.classList.toggle('resize-panel__body--disabled', !state.enabled);
    },
    destroy: () => wrapper.remove(),
  };
}
