import { db } from '../db.js';
import { state } from '../state.js';
import { ICON } from '../icons.js';
import {
  weekStart, weekLabel, weekDays, todayISO, dowLong, dowShort, formatDayCard,
  dayStatus, hasAnyRecordData, formatStudyTimeShort, escapeHtml,
} from '../utils.js';
import { getWeekRecords, downloadWeek } from '../export.js';
import { openMissingDataModal } from '../modals.js';
import { setScreen } from '../router.js';

async function weekOverallStatus(weekStartIso) {
  const records = await getWeekRecords(weekStartIso);
  const statuses = records.map(dayStatus);
  const anyData = records.some(hasAnyRecordData);
  const allComplete = statuses.every((s) => s === 'complete');
  return { statuses, anyData, allComplete };
}

async function getPastWeekStarts() {
  const all = await db.getAllRecords();
  const thisWeek = weekStart(todayISO());
  const set = new Set();
  all.forEach((r) => {
    const ws = weekStart(r.date);
    if (ws < thisWeek) set.add(ws);
  });
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
}

async function doDownload(weekStartIso) {
  const missing = await checkMissingLabelled(weekStartIso);
  if (missing.length) {
    openMissingDataModal(missing, {
      onFillIn: () => {
        // Navigate home to the first missing day within this week.
        const days = weekDays(weekStartIso);
        const target = days.find((d) => missing.includes(dowLong(d)));
        if (target) {
          state.currentDate = target;
          setScreen('home');
        }
      },
      onExportAnyway: async () => {
        state.downloadedWeeks = await downloadWeek(weekStartIso, state.fileType);
        if (state.reportView === 'preview') renderPreview(); else renderList();
      },
    });
  } else {
    state.downloadedWeeks = await downloadWeek(weekStartIso, state.fileType);
    if (state.reportView === 'preview') renderPreview(); else renderList();
  }
}

async function checkMissingLabelled(weekStartIso) {
  const records = await getWeekRecords(weekStartIso);
  const days = weekDays(weekStartIso);
  const missing = [];
  records.forEach((rec, i) => {
    if (dayStatus(rec) !== 'complete') missing.push(dowLong(days[i]));
  });
  return missing;
}

function weekRowDots(statuses) {
  return statuses.map((s) => `<span class="week-dot ${s === 'complete' ? '' : s}"></span>`).join('');
}

async function weekRowHtml(ws, isThisWeek) {
  const { statuses, anyData, allComplete } = await weekOverallStatus(ws);
  const downloaded = state.downloadedWeeks.includes(ws);
  let label;
  if (downloaded) label = 'Already downloaded';
  else if (!anyData) label = isThisWeek ? 'just started' : 'no data';
  else label = 'in progress';
  const disabled = !anyData;
  return `
    <div class="week-row" data-week-row="${ws}">
      <div class="week-row-info" data-week-info="${ws}">
        <div class="week-row-title">${isThisWeek ? 'This Week' : weekLabel(ws)}</div>
        ${isThisWeek ? `<div class="week-row-dates">${weekLabel(ws)}</div>` : ''}
        <div class="week-dots">${weekRowDots(statuses)}<span class="week-dots-label">${label}</span></div>
      </div>
      <button class="download-btn ${disabled ? 'disabled' : ''}" data-download-week="${ws}" ${disabled ? 'disabled' : ''}>${ICON.download}</button>
    </div>`;
}

async function renderList(direction) {
  state.reportView = 'list';
  const root = document.getElementById('screen-report');
  // Only carry scroll over for an in-place refresh (e.g. after a download)
  // — an actual navigation (direction set) should land at the top.
  const prevScroller = !direction ? root.querySelector('.screen-scroll') : null;
  const scrollTop = prevScroller ? prevScroller.scrollTop : 0;
  const thisWeek = weekStart(todayISO());
  const pastWeeks = await getPastWeekStarts();

  const thisWeekHtml = await weekRowHtml(thisWeek, true);
  const pastHtml = pastWeeks.length
    ? (await Promise.all(pastWeeks.map((ws) => weekRowHtml(ws, false)))).join('<div class="hair-sep" style="opacity:0.6;"></div>')
    : `<div class="report-empty">
         <div class="icon">${ICON.emptyReportIcon}</div>
         <div class="title">No past weeks yet</div>
         <div class="sub">Once a week is complete, it'll show up<br/>here for review and download.</div>
       </div>`;

  root.innerHTML = `
    <div class="screen-scroll ${direction ? `subview-anim-${direction}` : ''}">
      <div class="top-safe page-header">
        <button class="back-btn" id="report-back">${ICON.chevronLeft}</button>
        <h1>Week Report</h1>
      </div>
      <div class="thick-sep"></div>
      <div class="legend-row">
        <span class="legend-item"><span class="legend-dot" style="background:var(--white)"></span>Complete</span>
        <span class="legend-item"><span class="legend-dot" style="background:var(--amber)"></span>Partial</span>
        <span class="legend-item"><span class="legend-dot" style="background:var(--red)"></span>Missing</span>
      </div>
      ${thisWeekHtml}
      <div class="hair-sep"></div>
      ${pastHtml}
    </div>
    <div class="bottom-fixed" style="border-top:none;">
      <div class="icon-nav" style="border-top:2px solid var(--white);">
        <button class="icon-nav-btn" id="nav-home">${ICON.home}</button>
        <div class="icon-nav-divider"></div>
        <button class="icon-nav-btn active" id="nav-menu">${ICON.menu}</button>
      </div>
    </div>`;

  if (scrollTop) root.querySelector('.screen-scroll').scrollTop = scrollTop;

  root.querySelector('#report-back').addEventListener('click', () => setScreen('menu', { direction: 'back' }));
  root.querySelector('#nav-home').addEventListener('click', () => setScreen('home'));
  root.querySelector('#nav-menu').addEventListener('click', () => setScreen('menu', { direction: 'back' }));

  root.querySelectorAll('[data-download-week]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      doDownload(btn.dataset.downloadWeek);
    });
  });
  root.querySelectorAll('[data-week-info]').forEach((el) => {
    el.addEventListener('click', () => {
      state.previewWeekStart = el.dataset.weekInfo;
      renderPreview('forward');
    });
  });
}

function dayCardHtml(date, record) {
  const status = dayStatus(record);
  const dotColor = status === 'complete' ? 'var(--white)' : status === 'partial' ? 'var(--amber)' : 'var(--red)';
  const rec = record || {};
  const stat = (label, val) => `<div class="day-stat"><div class="label">${label}</div><div class="val">${val ?? '—'}</div></div>`;
  const pill = (label, on) => `<span class="day-pill ${on ? '' : 'off'}">${label}</span>`;

  const exerciseNames = (rec.exercises || []).map((e) => e.exerciseName || 'Exercise').join(', ');
  const cardioParts = (rec.cardioSessions || []).map((s) => `${s.type} ${s.distanceKm} km`).join(', ');
  let summaryHtml;
  if (!exerciseNames && !cardioParts) {
    summaryHtml = `<div class="day-summary rest">Rest day</div>`;
  } else {
    summaryHtml = [
      exerciseNames ? `<div class="day-summary">Workout · ${escapeHtml(exerciseNames)}</div>` : '',
      cardioParts ? `<div class="day-summary">Cardio · ${escapeHtml(cardioParts)}</div>` : '',
    ].join('');
  }

  return `
    <div class="day-card">
      <div class="day-card-head">
        <span class="dow">${formatDayCard(date)}</span>
        <span style="width:11px;height:11px;border-radius:50%;background:${dotColor};display:inline-block;"></span>
      </div>
      <div class="day-stats">
        ${stat('WEIGHT', rec.weight !== null && rec.weight !== undefined ? `${rec.weight} kg` : null)}
        ${stat('CREATINE', rec.creatine !== null && rec.creatine !== undefined ? `${rec.creatine} g` : null)}
        ${stat('STUDY', formatStudyTimeShort(rec.studyTimeMinutes))}
        ${stat('STEPS', rec.steps !== null && rec.steps !== undefined ? rec.steps.toLocaleString() : null)}
        ${stat('MOOD', rec.dayRating !== null && rec.dayRating !== undefined ? `${rec.dayRating}/10` : null)}
      </div>
      <div class="day-pills">
        ${pill('Bed', rec.madeBed)}
        ${pill('Skin', rec.skinCare)}
        ${pill('Mg', rec.magnesium)}
      </div>
      ${summaryHtml}
    </div>`;
}

async function renderPreview(direction) {
  state.reportView = 'preview';
  const ws = state.previewWeekStart;
  const root = document.getElementById('screen-report');
  const prevScroller = !direction ? root.querySelector('.screen-scroll') : null;
  const scrollTop = prevScroller ? prevScroller.scrollTop : 0;
  const days = weekDays(ws);
  const records = await getWeekRecords(ws);

  root.innerHTML = `
    <div class="screen-scroll ${direction ? `subview-anim-${direction}` : ''}">
      <div class="top-safe page-header" style="position:relative;">
        <button class="back-btn" id="preview-back">${ICON.chevronLeft}</button>
        <div>
          <h1 style="font-size:22px;">${weekLabel(ws)}</h1>
          <div style="font-size:11px;color:var(--text-faint);margin-top:2px;">Week Preview</div>
        </div>
        <button class="preview-filetype" id="preview-download">${ICON.downloadSm}${state.fileType.toUpperCase()}</button>
      </div>
      <div class="thick-sep" style="margin-bottom:14px;"></div>
      ${days.map((d, i) => dayCardHtml(d, records[i])).join('')}
    </div>
    <div class="bottom-fixed" style="border-top:none;">
      <div class="icon-nav" style="border-top:2px solid var(--white);">
        <button class="icon-nav-btn" id="nav-home">${ICON.home}</button>
        <div class="icon-nav-divider"></div>
        <button class="icon-nav-btn active" id="nav-menu">${ICON.menu}</button>
      </div>
    </div>`;

  if (scrollTop) root.querySelector('.screen-scroll').scrollTop = scrollTop;

  root.querySelector('#preview-back').addEventListener('click', () => renderList('back'));
  root.querySelector('#preview-download').addEventListener('click', () => doDownload(ws));
  root.querySelector('#nav-home').addEventListener('click', () => setScreen('home'));
  root.querySelector('#nav-menu').addEventListener('click', () => setScreen('menu', { direction: 'back' }));
}

export async function initReport() {
  state.downloadedWeeks = await db.getMeta('downloadedWeeks', []);
  await renderList();
}
