import { db } from './db.js';
import { weekDays, dayStatus, dowLong } from './utils.js';

export async function getWeekRecords(weekStartIso) {
  const days = weekDays(weekStartIso);
  const records = await Promise.all(days.map((d) => db.getRecord(d)));
  return days.map((date, i) => records[i] || null);
}

export async function checkMissingData(weekStartIso) {
  const records = await getWeekRecords(weekStartIso);
  const days = weekDays(weekStartIso);
  const missing = [];
  records.forEach((rec, i) => {
    const status = dayStatus(rec);
    if (status !== 'complete') missing.push(dowLong(days[i]));
  });
  return missing;
}

function dayToPlainRecord(date, rec) {
  const base = rec || {
    date, weight: null, madeBed: false, creatine: null, studyTimeMinutes: null,
    skinCare: false, steps: null, magnesium: false, dayRating: null,
    workout: false, exercises: [], cardio: false, cardioSessions: [],
  };
  return {
    date: base.date,
    weight: base.weight ?? null,
    madeBed: !!base.madeBed,
    creatine: base.creatine ?? null,
    studyTimeMinutes: base.studyTimeMinutes ?? null,
    skinCare: !!base.skinCare,
    steps: base.steps ?? null,
    magnesium: !!base.magnesium,
    dayRating: base.dayRating ?? null,
    workout: !!base.workout,
    exercises: (base.exercises || []).map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
    cardio: !!base.cardio,
    cardioSessions: (base.cardioSessions || []).map((c) => ({ type: c.type, distanceKm: c.distanceKm, durationMinutes: c.durationMinutes })),
  };
}

function toJSON(days, records) {
  const payload = days.map((date, i) => dayToPlainRecord(date, records[i]));
  return JSON.stringify(payload, null, 2);
}

// CSV flattening scheme: one row per day. `exercises` and `cardioSessions` are
// serialized to a single JSON string per cell (valid CSV, easy to re-parse).
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(days, records) {
  const header = ['date', 'weight', 'madeBed', 'creatine', 'studyTimeMinutes', 'skinCare', 'steps', 'magnesium', 'dayRating', 'workout', 'exercises', 'cardio', 'cardioSessions'];
  const lines = [header.join(',')];
  days.forEach((date, i) => {
    const r = dayToPlainRecord(date, records[i]);
    const row = [
      r.date, r.weight, r.madeBed, r.creatine, r.studyTimeMinutes, r.skinCare,
      r.steps, r.magnesium, r.dayRating, r.workout,
      JSON.stringify(r.exercises), r.cardio, JSON.stringify(r.cardioSessions),
    ].map(csvCell);
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

export async function buildExportFile(weekStartIso, fileType) {
  const days = weekDays(weekStartIso);
  const records = await getWeekRecords(weekStartIso);
  if (fileType === 'csv') {
    return { content: toCSV(days, records), mime: 'text/csv', ext: 'csv' };
  }
  return { content: toJSON(days, records), mime: 'application/json', ext: 'json' };
}

export async function downloadWeek(weekStartIso, fileType) {
  const { content, mime, ext } = await buildExportFile(weekStartIso, fileType);
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily-tracker_week-${weekStartIso}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const downloaded = await db.getMeta('downloadedWeeks', []);
  if (!downloaded.includes(weekStartIso)) {
    downloaded.push(weekStartIso);
    await db.setMeta('downloadedWeeks', downloaded);
  }
  return downloaded;
}
