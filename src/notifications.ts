import type { Notification } from './types';
import { generateId } from './utils';

const container = document.createElement('div');
container.className = 'notification-container';
container.setAttribute('role', 'status');
container.setAttribute('aria-live', 'polite');
container.setAttribute('aria-atomic', 'true');

let initialized = false;

function ensureContainer(): void {
  if (initialized) return;
  document.body.appendChild(container);
  initialized = true;
}

export function notify(message: string, type: Notification['type'] = 'info', duration = 4000): void {
  ensureContainer();

  const id = generateId();
  const el = document.createElement('div');
  el.className = `notification notification--${type}`;
  el.id = `notification-${id}`;
  el.setAttribute('role', 'alert');

  const icon = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';

  el.innerHTML = `
    <span class="notification__icon" aria-hidden="true">${icon}</span>
    <span class="notification__message">${escapeHtml(message)}</span>
    <button class="notification__close" aria-label="Dismiss notification" type="button">x</button>
  `;

  el.querySelector('.notification__close')?.addEventListener('click', () => dismiss(el));

  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('notification--visible'));
  });

  if (duration > 0) {
    setTimeout(() => dismiss(el), duration);
  }
}

function dismiss(el: HTMLElement): void {
  el.classList.remove('notification--visible');
  el.classList.add('notification--leaving');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 400);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
