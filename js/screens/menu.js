import { db } from '../db.js';
import { state } from '../state.js';
import { ICON } from '../icons.js';
import { setScreen } from '../router.js';

export function renderMenu() {
  const root = document.getElementById('screen-menu');
  root.innerHTML = `
    <div class="screen-scroll">
      <div class="top-safe greeting-header"><h1>Menu</h1></div>
      <div class="thick-sep" style="margin-bottom:16px;"></div>

      <div class="menu-card" id="menu-week-report">
        <div class="menu-card-icon">${ICON.calendarIcon}</div>
        <div class="menu-card-text">
          <div class="title">Week Report</div>
          <div class="sub">View &amp; download past weeks</div>
        </div>
        <div class="menu-card-chevron">${ICON.chevronRight}</div>
      </div>

      <div class="menu-card" id="menu-exercise-library">
        <div class="menu-card-icon">${ICON.dumbbellIcon}</div>
        <div class="menu-card-text">
          <div class="title">Exercise Library</div>
          <div class="sub">Manage strength &amp; cardio exercises</div>
        </div>
        <div class="menu-card-chevron">${ICON.chevronRight}</div>
      </div>

      <div class="filetype-card">
        <div class="title">File Type</div>
        <div class="segmented" id="filetype-switch">
          <button data-v="json" class="${state.fileType === 'json' ? 'active' : ''}">JSON</button>
          <button data-v="csv" class="${state.fileType === 'csv' ? 'active' : ''}">CSV</button>
        </div>
      </div>
    </div>
    <div class="bottom-fixed" style="border-top:none;">
      <div class="icon-nav" style="border-top:2px solid var(--white);">
        <button class="icon-nav-btn" id="nav-home">${ICON.home}</button>
        <div class="icon-nav-divider"></div>
        <button class="icon-nav-btn active" id="nav-menu">${ICON.menu}</button>
      </div>
    </div>`;

  root.querySelector('#menu-week-report').addEventListener('click', () => setScreen('report', { direction: 'forward' }));
  root.querySelector('#menu-exercise-library').addEventListener('click', () => setScreen('library', { direction: 'forward' }));
  root.querySelector('#nav-home').addEventListener('click', () => setScreen('home'));
  root.querySelector('#nav-menu').addEventListener('click', () => setScreen('menu'));

  root.querySelectorAll('#filetype-switch button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      state.fileType = btn.dataset.v;
      await db.setMeta('fileType', state.fileType);
      renderMenu();
    });
  });
}

export async function initMenu() {
  renderMenu();
}
