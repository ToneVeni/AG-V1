import { ICON } from './icons.js';

// ---------- Toast ----------

let toastTimer = null;

export function showToast({ kind, text, onRetry }) {
  const wrap = document.getElementById('toast-wrap');
  clearTimeout(toastTimer);
  const icon = kind === 'saved' ? ICON.checkWhite : ICON.alertCircle;
  wrap.innerHTML = `
    <div class="toast ${kind}" id="active-toast">
      <span class="toast-icon">${icon}</span>
      <span>${text}</span>
      ${kind === 'failed' ? '<button class="toast-retry" id="toast-retry-btn">RETRY</button>' : ''}
    </div>`;
  const el = document.getElementById('active-toast');
  requestAnimationFrame(() => el.classList.add('show'));
  if (kind === 'failed' && onRetry) {
    document.getElementById('toast-retry-btn').addEventListener('click', () => {
      hideToast();
      onRetry();
    });
  }
  const duration = kind === 'saved' ? 1800 : 5000;
  toastTimer = setTimeout(hideToast, duration);
}

export function hideToast() {
  const el = document.getElementById('active-toast');
  if (el) el.classList.remove('show');
  clearTimeout(toastTimer);
}

// ---------- Modal ----------

export function openModal(innerHtml) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `<div class="modal-card">${innerHtml}</div>`;
  requestAnimationFrame(() => overlay.classList.add('open'));
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  setTimeout(() => {
    if (!overlay.classList.contains('open')) overlay.innerHTML = '';
  }, 200);
}

export function modalCloseBtn() {
  return `<button class="modal-close" id="modal-close-btn">${ICON.close}</button>`;
}

export function wireModalClose() {
  const btn = document.getElementById('modal-close-btn');
  if (btn) btn.addEventListener('click', closeModal);
}

// ---------- Long press ----------

// Attaches a 1s press-and-hold gesture to `el`. Adds `pressingClass` during hold
// for visual darkening feedback, and calls onComplete() once the hold finishes.
// Also supports a plain tap callback (onTap) fired if released before the hold completes.
export function attachLongPress(el, { onComplete, onTap, pressingClass = 'pressing', duration = 1000 }) {
  let timer = null;
  let held = false;

  const start = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    held = false;
    el.classList.add(pressingClass);
    timer = setTimeout(() => {
      held = true;
      el.classList.remove(pressingClass);
      onComplete && onComplete();
    }, duration);
  };
  const cancel = () => {
    clearTimeout(timer);
    el.classList.remove(pressingClass);
  };
  const end = () => {
    const wasHeld = held;
    cancel();
    if (!wasHeld && onTap) onTap();
  };

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
}

// ---------- Custom select (dropdown) ----------

export function renderSelect({ id, value, placeholder, options }) {
  const selected = options.find((o) => o.value === value);
  return `
    <div class="select-input" id="${id}" tabindex="0">
      <span>${selected ? selected.label : `<span style="color:var(--text-faint)">${placeholder || 'Select…'}</span>`}</span>
      <span class="chev">${ICON.chevronDown}</span>
    </div>
    <div class="select-dropdown" id="${id}-dropdown">
      ${options.map((o) => `
        <div class="select-option ${o.value === value ? 'selected' : ''}" data-value="${o.value}">
          <span>${o.label}</span>
          <span class="check">${ICON.checkWhite.replace('#000', 'currentColor')}</span>
        </div>`).join('')}
    </div>`;
}

export function wireSelect(id, onChange) {
  const input = document.getElementById(id);
  const dropdown = document.getElementById(`${id}-dropdown`);
  if (!input || !dropdown) return;
  input.addEventListener('click', () => {
    const isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.select-dropdown.open').forEach((d) => d.classList.remove('open'));
    document.querySelectorAll('.select-input.open').forEach((d) => d.classList.remove('open'));
    if (!isOpen) {
      dropdown.classList.add('open');
      input.classList.add('open');
    }
  });
  dropdown.querySelectorAll('.select-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      dropdown.classList.remove('open');
      input.classList.remove('open');
      onChange(opt.dataset.value);
    });
  });
}
