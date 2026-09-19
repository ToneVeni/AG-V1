import { state } from './state.js';

const screenIds = ['home', 'menu', 'library', 'report'];
// home/menu are peer top-level tabs; library/report are subscreens reached
// only through menu, so they slide in from the right and back out to the
// right, like a standard drill-in navigation stack.
const LEVEL = { home: 0, menu: 0, library: 1, report: 1 };
const handlers = {};

let transitioning = false;

export function registerScreen(name, initFn) {
  handlers[name] = initFn;
}

function screenEl(id) {
  return document.getElementById(`screen-${id}`);
}

export function currentLevel() {
  return LEVEL[state.screen];
}

export function levelOf(name) {
  return LEVEL[name];
}

function resetStyles(el) {
  el.style.transition = '';
  el.style.transform = '';
  el.style.opacity = '';
  el.style.zIndex = '';
}

export async function setScreen(name, opts = {}) {
  if (transitioning) return;
  const prevName = state.screen;
  const prevEl = screenEl(prevName);
  const nextEl = screenEl(name);
  if (!nextEl) return;
  if (prevName === name) {
    // Re-entering the same screen (e.g. tapping the active tab) — just re-render.
    if (handlers[name]) await handlers[name](opts);
    return;
  }

  const shouldAnimate = opts.animate !== false && prevEl;
  const direction = opts.direction || (LEVEL[name] > LEVEL[prevName] ? 'forward'
    : LEVEL[name] < LEVEL[prevName] ? 'back' : 'fade');

  state.screen = name;
  nextEl.hidden = false;
  nextEl.style.zIndex = '2';
  if (prevEl) prevEl.style.zIndex = '1';

  if (shouldAnimate) {
    nextEl.style.transition = 'none';
    if (direction === 'forward') nextEl.style.transform = 'translateX(100%)';
    else if (direction === 'back') nextEl.style.transform = 'translateX(-100%)';
    else { nextEl.style.transform = 'none'; nextEl.style.opacity = '0'; }
  }

  if (handlers[name]) await handlers[name](opts);

  if (!shouldAnimate) {
    if (prevEl && prevEl !== nextEl) { prevEl.hidden = true; prevEl.innerHTML = ''; resetStyles(prevEl); }
    resetStyles(nextEl);
    return;
  }

  transitioning = true;
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      const easing = 'transform 300ms cubic-bezier(.22,.68,.36,1), opacity 300ms ease';
      nextEl.style.transition = easing;
      if (prevEl) prevEl.style.transition = easing;

      if (direction === 'forward') {
        nextEl.style.transform = 'translateX(0)';
        if (prevEl) prevEl.style.transform = 'translateX(-26%)';
      } else if (direction === 'back') {
        nextEl.style.transform = 'translateX(0)';
        if (prevEl) prevEl.style.transform = 'translateX(100%)';
      } else {
        nextEl.style.opacity = '1';
        if (prevEl) prevEl.style.opacity = '0';
      }

      setTimeout(() => {
        if (prevEl && prevEl !== nextEl) { prevEl.hidden = true; prevEl.innerHTML = ''; resetStyles(prevEl); }
        resetStyles(nextEl);
        transitioning = false;
        resolve();
      }, 300);
    });
  });
}

// ---------- Swipe-back gesture (edge swipe → drill back to Menu) ----------
//
// Live-follows the finger: the current screen (library/report) is dragged
// with the pointer while Menu is revealed underneath with a subtle parallax,
// mirroring the tap-triggered transition above. Only starts from a touch
// near the left edge so it never fights normal scrolling/tapping elsewhere.

const EDGE_ZONE = 28;
const COMPLETE_RATIO = 0.3;
const COMPLETE_VELOCITY = 0.55; // px/ms

export function enableSwipeBack(screenName, targetName) {
  const el = screenEl(screenName);
  if (!el) return;

  let tracking = false; // pointer is down, inside the edge zone
  let confirmed = false; // gesture has been confirmed horizontal
  let aborted = false; // confirmed vertical instead — let native scroll happen
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let width = 0;
  let targetEl = null;
  let pointerId = null;

  const onPointerDown = (e) => {
    if (transitioning) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.clientX > EDGE_ZONE) return;
    tracking = true;
    confirmed = false;
    aborted = false;
    startX = e.clientX;
    startY = e.clientY;
    startTime = performance.now();
    width = window.innerWidth;
    pointerId = e.pointerId;
  };

  const onPointerMove = (e) => {
    if (!tracking || aborted || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!confirmed) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        confirmed = true;
        targetEl = screenEl(targetName);
        if (targetEl) {
          targetEl.hidden = false;
          targetEl.style.zIndex = '1';
          targetEl.style.transition = 'none';
          targetEl.style.transform = 'translateX(-26%)';
        }
        el.style.zIndex = '2';
        el.style.transition = 'none';
        el.setPointerCapture && el.setPointerCapture(pointerId);
      } else if (Math.abs(dy) > 10) {
        aborted = true;
        tracking = false;
      }
    }

    if (confirmed) {
      e.preventDefault();
      const clamped = Math.max(0, dx);
      const progress = Math.min(1, clamped / width);
      el.style.transform = `translateX(${clamped}px)`;
      if (targetEl) targetEl.style.transform = `translateX(${-26 + 26 * progress}%)`;
    }
  };

  const finish = (e) => {
    if (!tracking) return;
    tracking = false;
    if (!confirmed) return;

    const dx = Math.max(0, (e.clientX ?? startX) - startX);
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = dx / elapsed;
    const progress = dx / width;
    const complete = progress > COMPLETE_RATIO || velocity > COMPLETE_VELOCITY;

    transitioning = true;
    const easing = 'transform 260ms cubic-bezier(.22,.68,.36,1)';
    el.style.transition = easing;
    if (targetEl) targetEl.style.transition = easing;

    if (complete) {
      el.style.transform = 'translateX(100%)';
      if (targetEl) targetEl.style.transform = 'translateX(0)';
      setTimeout(async () => {
        el.hidden = true;
        el.innerHTML = '';
        resetStyles(el);
        if (targetEl) { targetEl.style.zIndex = '2'; resetStyles(targetEl); }
        state.screen = targetName;
        transitioning = false;
        if (handlers[targetName]) await handlers[targetName]({ animate: false });
      }, 260);
    } else {
      el.style.transform = 'translateX(0)';
      if (targetEl) targetEl.style.transform = 'translateX(-26%)';
      setTimeout(() => {
        resetStyles(el);
        if (targetEl) { targetEl.hidden = true; targetEl.innerHTML = ''; resetStyles(targetEl); }
        transitioning = false;
      }, 260);
    }
  };

  el.addEventListener('pointerdown', onPointerDown, { passive: true });
  el.addEventListener('pointermove', onPointerMove, { passive: false });
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
}
