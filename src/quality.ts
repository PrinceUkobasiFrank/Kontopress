import { clamp } from './utils';

export function createQualitySlider(
  container: HTMLElement,
  initialValue: number,
  onChange: (value: number) => void
): { setValue: (value: number) => void; destroy: () => void } {
  const wrapper = document.createElement('div');
  wrapper.className = 'quality-slider';

  const labelRow = document.createElement('div');
  labelRow.className = 'quality-slider__labels';
  labelRow.innerHTML = `
    <span class="quality-slider__label">Quality</span>
    <span class="quality-slider__value" aria-live="polite">${initialValue}%</span>
  `;

  const track = document.createElement('div');
  track.className = 'quality-slider__track';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '10';
  input.max = '100';
  input.value = String(initialValue);
  input.className = 'quality-slider__input';
  input.setAttribute('aria-label', 'Compression quality');

  const fill = document.createElement('div');
  fill.className = 'quality-slider__fill';
  fill.style.width = `${initialValue}%`;

  track.appendChild(fill);
  track.appendChild(input);
  wrapper.appendChild(labelRow);
  wrapper.appendChild(track);
  container.appendChild(wrapper);

  const update = (value: number) => {
    const clamped = clamp(value, 10, 100);
    input.value = String(clamped);
    fill.style.width = `${clamped}%`;
    labelRow.querySelector('.quality-slider__value')!.textContent = `${clamped}%`;
    onChange(clamped);
  };

  const handleInput = () => update(parseInt(input.value, 10));

  input.addEventListener('input', handleInput);

  return {
    setValue: update,
    destroy: () => {
      input.removeEventListener('input', handleInput);
      wrapper.remove();
    },
  };
}
