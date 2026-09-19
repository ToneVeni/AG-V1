import { db } from '../db.js';
import { state } from '../state.js';
import { ICON } from '../icons.js';
import { escapeHtml } from '../utils.js';
import { attachLongPress } from '../components.js';
import {
  openExerciseActionModal, openRenameExerciseModal,
  openDeleteExerciseConfirmModal, openAddNewExerciseModal,
} from '../modals.js';
import { setScreen } from '../router.js';

async function reloadLibrary() {
  state.library = await db.getLibrary();
}

function sectionHtml(category, title) {
  const items = state.library
    .filter((e) => e.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = items.map((ex) => `
    <div class="lib-row" data-ex-id="${ex.id}">
      <span>${escapeHtml(ex.name)}</span>
      <span class="chevron">${ICON.chevronSmall}</span>
    </div>`).join('<div class="hair-sep"></div>');

  const empty = `
    <div class="lib-empty">
      <div class="icon">${category === 'strength' ? ICON.dumbbellIcon : ICON.pulseIcon}</div>
      <div class="title">No ${category} exercises yet</div>
      <div class="sub">Tap + Add to create your first one.</div>
    </div>`;

  return `
    <div class="lib-section">
      <div class="lib-section-header">
        <h3>${title}</h3>
        <button class="add-link" data-add-category="${category}"><span class="plus-circle-sm">${ICON.plusCircleSm}</span>Add</button>
      </div>
      ${items.length ? rows : empty}
    </div>`;
}

export function renderLibrary() {
  const root = document.getElementById('screen-library');
  const prevScroller = root.querySelector('.screen-scroll');
  const scrollTop = prevScroller ? prevScroller.scrollTop : 0;

  root.innerHTML = `
    <div class="screen-scroll">
      <div class="top-safe page-header">
        <button class="back-btn" id="lib-back">${ICON.chevronLeft}</button>
        <h1>Exercise Library</h1>
      </div>
      <div class="thick-sep"></div>
      ${sectionHtml('strength', 'Strength')}
      ${sectionHtml('cardio', 'Cardio')}
    </div>
    <div class="bottom-fixed" style="border-top:none;">
      <div class="icon-nav" style="border-top:2px solid var(--white);">
        <button class="icon-nav-btn" id="nav-home">${ICON.home}</button>
        <div class="icon-nav-divider"></div>
        <button class="icon-nav-btn active" id="nav-menu">${ICON.menu}</button>
      </div>
    </div>`;

  if (scrollTop) root.querySelector('.screen-scroll').scrollTop = scrollTop;

  root.querySelector('#lib-back').addEventListener('click', () => setScreen('menu', { direction: 'back' }));
  root.querySelector('#nav-home').addEventListener('click', () => setScreen('home'));
  root.querySelector('#nav-menu').addEventListener('click', () => setScreen('menu', { direction: 'back' }));

  root.querySelectorAll('[data-add-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openAddNewExerciseModal(btn.dataset.addCategory, async () => {
        await reloadLibrary();
        renderLibrary();
      });
    });
  });

  root.querySelectorAll('[data-ex-id]').forEach((row) => {
    attachLongPress(row, {
      onComplete: () => {
        const ex = state.library.find((e) => e.id === row.dataset.exId);
        openExerciseActionModal(ex, {
          onRename: () => openRenameExerciseModal(ex, async () => {
            await reloadLibrary();
            renderLibrary();
          }),
          onDelete: () => openDeleteExerciseConfirmModal(ex, async () => {
            await reloadLibrary();
            renderLibrary();
          }),
        });
      },
    });
  });
}

export async function initLibrary() {
  await reloadLibrary();
  renderLibrary();
}
