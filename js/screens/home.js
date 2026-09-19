import { db, emptyRecord } from '../db.js';
import { state } from '../state.js';
import {
  todayISO, addDays, dowShort, formatDateSlash, isFuture,
  parseStudyTime, formatStudyTime, formatStudyTimeShort, debounce, escapeHtml,
} from '../utils.js';
import { ICON } from '../icons.js';
import { showToast, attachLongPress } from '../components.js';
import {
  openAddExerciseModal, openAddSetModal, openEditSetModal,
  openAddCardioModal, openEditCardioModal,
} from '../modals.js';
import { setScreen } from '../router.js';

let saveTimer = null;

async function loadRecordForCurrentDate() {
  const rec = await db.getRecord(state.currentDate);
  state.record = rec || emptyRecord(state.currentDate);
}

function fieldDisplay(key, record) {
  const v = record[key];
  switch (key) {
    case 'weight':
      return v === null ? { text: '—', empty: true } : { text: `${v} kg`, empty: false };
    case 'creatine':
      return v === null ? { text: '—', empty: true } : { text: `${v} g`, empty: false };
    case 'studyTimeMinutes':
      return v === null ? { text: '—', empty: true } : { text: formatStudyTimeShort(v), empty: false };
    case 'steps':
      return v === null ? { text: '—', empty: true } : { text: v.toLocaleString(), empty: false };
    case 'dayRating':
      return v === null ? { text: '—', empty: true } : { text: `${v}/10`, empty: false };
    default:
      return { text: '—', empty: true };
  }
}

async function persistRecord(showSavedToast = true) {
  try {
    await db.putRecord(state.record);
    if (showSavedToast) showToast({ kind: 'saved', text: 'Saved' });
  } catch (err) {
    showToast({ kind: 'failed', text: "Couldn't save · Retry", onRetry: () => persistRecord(showSavedToast) });
  }
}

const debouncedSave = debounce(() => persistRecord(true), 500);

function flashDot(key) {
  const dot = document.querySelector(`.field-dot[data-for="${key}"]`);
  if (!dot) return;
  dot.style.opacity = '1';
  setTimeout(() => { if (dot) dot.style.opacity = '0'; }, 1800);
}

// ---------- Inline text field editing (targeted DOM ops, no full re-render) ----------

function enterEditMode(key, container) {
  const record = state.record;
  const current = record[key];
  let inputHtml;
  if (key === 'studyTimeMinutes') {
    inputHtml = `<input type="text" inputmode="numeric" class="field-input" id="edit-${key}" value="${current !== null ? formatStudyTime(current) : ''}" placeholder="1:20" style="width:90px;" />`;
  } else if (key === 'weight') {
    inputHtml = `<span style="color:var(--text-faint);font-size:13px;">kg</span><input type="text" inputmode="decimal" class="field-input" id="edit-${key}" value="${current !== null ? current : ''}" style="width:90px;" />`;
  } else if (key === 'creatine') {
    inputHtml = `<span style="color:var(--text-faint);font-size:13px;">g</span><input type="text" inputmode="numeric" class="field-input" id="edit-${key}" value="${current !== null ? current : ''}" style="width:80px;" />`;
  } else if (key === 'steps') {
    inputHtml = `<input type="text" inputmode="numeric" class="field-input" id="edit-${key}" value="${current !== null ? current : ''}" style="width:110px;" />`;
  } else if (key === 'dayRating') {
    inputHtml = `<input type="text" inputmode="numeric" class="field-input" id="edit-${key}" value="${current !== null ? current : ''}" placeholder="1-10" style="width:80px;" />`;
  }
  container.innerHTML = `<span class="field-dot" data-for="${key}" style="opacity:0;"></span>${inputHtml}`;
  const input = document.getElementById(`edit-${key}`);
  input.focus();
  input.select();

  const commit = (silent) => {
    const raw = input.value.trim();
    if (key === 'studyTimeMinutes') {
      const { minutes, valid } = parseStudyTime(raw);
      if (!valid) {
        input.classList.add('invalid-input');
        return false;
      }
      state.record.studyTimeMinutes = minutes;
    } else if (raw === '') {
      state.record[key] = null;
    } else if (key === 'weight') {
      const n = parseFloat(raw);
      state.record[key] = isNaN(n) ? null : n;
    } else {
      const n = parseInt(raw, 10);
      state.record[key] = isNaN(n) ? null : n;
    }
    if (!silent) {
      flashDot(key);
      debouncedSave();
    }
    return true;
  };

  input.addEventListener('input', () => {
    if (key === 'studyTimeMinutes') {
      // inputmode="numeric" gives mobile keyboards a digits-only keypad with
      // no ":" key, so the colon has to be inserted for the user. Cascade
      // like a currency field so it's visible from the first digit: the
      // rightmost two digits typed are always minutes, anything before that
      // is hours — "1" -> "0:01", "14" -> "0:14", "145" -> "1:45".
      const caretAtEnd = input.selectionStart === input.value.length;
      const digits = input.value.replace(/\D/g, '').slice(0, 5);
      let formatted = '';
      if (digits.length > 0) {
        const padded = digits.length <= 2 ? digits.padStart(2, '0') : digits;
        const hours = padded.length > 2 ? padded.slice(0, -2) : '0';
        const minutes = padded.slice(-2);
        formatted = `${hours}:${minutes}`;
      }
      if (formatted !== input.value) {
        input.value = formatted;
        if (caretAtEnd) input.setSelectionRange(formatted.length, formatted.length);
      }
      if (digits.length > 0) {
        const { valid } = parseStudyTime(formatted);
        input.style.color = valid ? '' : 'var(--red)';
      } else {
        input.style.color = '';
      }
    }
    commit(false);
  });

  const exit = () => {
    commit(true);
    debouncedSave();
    renderFieldValue(key, container);
  };

  input.addEventListener('blur', exit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
}

function renderFieldValue(key, container) {
  const { text, empty } = fieldDisplay(key, state.record);
  container.innerHTML = `<span class="field-dot" data-for="${key}" style="opacity:0;"></span><span class="field-value ${empty ? 'empty' : ''}">${text}</span>`;
  container.onclick = () => { if (!isFuture(state.currentDate)) enterEditMode(key, container); };
}

// ---------- Render ----------

function renderDailyFieldRow(key, label) {
  const isBool = ['madeBed', 'skinCare', 'magnesium'].includes(key);
  if (isBool) {
    const checked = !!state.record[key];
    return `
      <div class="field-row">
        <span class="field-label">${label}</span>
        <button class="checkbox ${checked ? 'checked' : ''}" data-bool-field="${key}">${ICON.check}</button>
      </div>`;
  }
  return `
    <div class="field-row">
      <span class="field-label">${label}</span>
      <div class="field-value-wrap" data-field-container="${key}" style="display:flex;align-items:center;gap:6px;"></div>
    </div>`;
}

function exerciseBlockHtml(ex, exIndex) {
  const setsHtml = ex.sets.map((s, si) => `
    <div class="set-row" data-set-row="${exIndex}:${si}">Set ${si + 1}&nbsp;&nbsp;&nbsp;&nbsp;${s.reps} reps&nbsp;&nbsp;&nbsp;&nbsp;+${s.weightKg} kg</div>
  `).join('');
  return `
    <div class="exercise-block">
      <div class="exercise-name" data-exercise-name="${exIndex}">${escapeHtml(ex.exerciseName || 'Unknown Exercise')}</div>
      ${setsHtml}
      <div class="add-set-row" data-add-set="${exIndex}"><span class="plus-circle-sm">${ICON.plusCircleSm}</span>Add set</div>
    </div>`;
}

function cardioBlockHtml(session, idx) {
  return `
    <div class="cardio-block">
      <div class="cardio-name">${escapeHtml(session.type)}</div>
      <div class="cardio-detail" data-cardio-row="${idx}">${session.distanceKm} km&nbsp;&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;&nbsp;${session.durationMinutes} min</div>
    </div>`;
}

export function renderHome() {
  const root = document.getElementById('screen-home');
  const record = state.record;
  const date = state.currentDate;

  // Every action (delete a set, add an exercise, toggle a box, ...) fully
  // rebuilds this screen's markup, which otherwise creates a brand-new
  // scroll container that always starts pinned to the top — jerking the
  // page back to "Hello, António" after e.g. a long-press delete deep in
  // the Workout section. Carry the scroll offset across the rebuild.
  const prevScroller = root.querySelector('#home-scroll');
  const scrollTop = prevScroller ? prevScroller.scrollTop : 0;

  const dailyFields = [
    ['weight', 'Weight'], ['madeBed', 'Made Bed'], ['creatine', 'Creatine'],
    ['studyTimeMinutes', 'Study Time'], ['skinCare', 'Skin Care'], ['steps', 'Steps'],
    ['magnesium', 'Magnesium'], ['dayRating', 'Day Rating'],
  ];

  const greetingName = 'António';

  root.innerHTML = `
    <div class="screen-scroll" id="home-scroll">
      <div class="top-safe greeting-header"><h1>Hello<span class="comma">,</span> ${escapeHtml(greetingName)}</h1></div>
      <div class="thick-sep"></div>
      <div class="daily-list">
        ${dailyFields.map(([k, l]) => renderDailyFieldRow(k, l)).join('<div class="thin-sep"></div>')}
      </div>
      <div class="thick-sep" style="margin-top:8px;"></div>
      <div class="section" id="workout-section">
        <div class="section-header">
          <h2>Workout</h2>
          <div class="section-header-right">
            <span class="auto-label">auto</span>
            <button class="section-checkbox ${record.workout ? 'checked' : ''}" id="workout-checkbox">${ICON.check}</button>
          </div>
        </div>
        <div id="exercise-list">
          ${record.exercises.map((ex, i) => exerciseBlockHtml(ex, i)).join('')}
        </div>
        <div class="add-exercise-row" id="add-exercise-btn"><span class="plus-circle-lg">${ICON.plusCircleLg}</span>Add exercise</div>
      </div>
      <div class="section" id="cardio-section">
        <div class="section-header">
          <h2>Cardio</h2>
          <div class="section-header-right">
            <button class="section-checkbox ${record.cardio ? 'checked' : ''}" id="cardio-checkbox">${ICON.check}</button>
          </div>
        </div>
        <div id="cardio-list">
          ${record.cardioSessions.map((s, i) => cardioBlockHtml(s, i)).join('')}
        </div>
        <div class="add-session-row" id="add-session-btn"><span class="plus-circle-lg">${ICON.plusCircleLg}</span>Add session</div>
      </div>
    </div>
    <div class="bottom-fixed">
      <div class="date-nav">
        <button id="date-prev">${ICON.chevronLeft}</button>
        <div class="date-label"><span class="dow">${dowShort(date)}</span><span class="full">${formatDateSlash(date)}</span></div>
        <button id="date-next" ${isFuture(addDays(date, 1)) ? 'disabled' : ''}>${ICON.chevronRight}</button>
      </div>
      <div class="icon-nav">
        <button class="icon-nav-btn active" id="nav-home">${ICON.home}</button>
        <div class="icon-nav-divider"></div>
        <button class="icon-nav-btn" id="nav-menu">${ICON.menu}</button>
      </div>
    </div>`;

  // render field value containers
  dailyFields.forEach(([k]) => {
    if (['madeBed', 'skinCare', 'magnesium'].includes(k)) return;
    const container = root.querySelector(`[data-field-container="${k}"]`);
    if (container) renderFieldValue(k, container);
  });

  wireHomeEvents(root);

  if (scrollTop) root.querySelector('#home-scroll').scrollTop = scrollTop;
}

function wireHomeEvents(root) {
  const record = state.record;

  root.querySelectorAll('[data-bool-field]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.boolField;
      record[key] = !record[key];
      btn.classList.toggle('checked', record[key]);
      await persistRecord(true);
    });
  });

  document.getElementById('workout-checkbox').addEventListener('click', async () => {
    record.workout = !record.workout;
    await persistRecord(true);
    renderHome();
  });
  document.getElementById('cardio-checkbox').addEventListener('click', async () => {
    record.cardio = !record.cardio;
    await persistRecord(true);
    renderHome();
  });

  document.getElementById('add-exercise-btn').addEventListener('click', () => {
    openAddExerciseModal(record, () => renderHome());
  });
  document.getElementById('add-session-btn').addEventListener('click', () => {
    openAddCardioModal(record, () => renderHome());
  });

  root.querySelectorAll('[data-add-set]').forEach((el) => {
    el.addEventListener('click', () => {
      const exIndex = parseInt(el.dataset.addSet, 10);
      openAddSetModal(record, exIndex, () => renderHome());
    });
  });

  root.querySelectorAll('[data-set-row]').forEach((el) => {
    attachLongPress(el, {
      onTap: () => {
        const [exIndex, setIndex] = el.dataset.setRow.split(':').map(Number);
        openEditSetModal(record, exIndex, setIndex, () => renderHome());
      },
      onComplete: async () => {
        const [exIndex, setIndex] = el.dataset.setRow.split(':').map(Number);
        const ex = record.exercises[exIndex];
        ex.sets.splice(setIndex, 1);
        if (ex.sets.length === 0) record.exercises.splice(exIndex, 1);
        if (record.exercises.length === 0) record.workout = false;
        await persistRecord(true);
        renderHome();
      },
    });
  });

  root.querySelectorAll('[data-cardio-row]').forEach((el) => {
    attachLongPress(el, {
      onTap: () => {
        const idx = parseInt(el.dataset.cardioRow, 10);
        openEditCardioModal(record, idx, () => renderHome());
      },
      onComplete: async () => {
        const idx = parseInt(el.dataset.cardioRow, 10);
        record.cardioSessions.splice(idx, 1);
        if (record.cardioSessions.length === 0) record.cardio = false;
        await persistRecord(true);
        renderHome();
      },
    });
  });

  document.getElementById('date-prev').addEventListener('click', () => changeDate(-1));
  document.getElementById('date-next').addEventListener('click', () => changeDate(1));
  document.getElementById('nav-home').addEventListener('click', () => setScreen('home'));
  document.getElementById('nav-menu').addEventListener('click', () => setScreen('menu'));
}

async function changeDate(delta) {
  const next = addDays(state.currentDate, delta);
  if (isFuture(next)) return;
  state.currentDate = next;
  await loadRecordForCurrentDate();
  renderHome();
}

export async function initHome() {
  await loadRecordForCurrentDate();
  renderHome();
}
