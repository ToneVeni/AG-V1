// Date + formatting helpers. All dates are local-time "YYYY-MM-DD" strings.

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function dowShort(iso) {
  return DOW_SHORT[fromISODate(iso).getDay()];
}

export function dowLong(iso) {
  return DOW_LONG[fromISODate(iso).getDay()];
}

export function formatDateSlash(iso) {
  const d = fromISODate(iso);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDayCard(iso) {
  const d = fromISODate(iso);
  return `${dowShort(iso)}, ${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
}

// Monday-start week key: returns ISO date of the Monday for the week containing `iso`.
export function weekStart(iso) {
  const d = fromISODate(iso);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function weekLabel(startIso) {
  const start = fromISODate(startIso);
  const end = fromISODate(addDays(startIso, 6));
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = `${MON_SHORT[start.getMonth()]} ${start.getDate()}`;
  let endStr;
  if (sameMonth) {
    endStr = `${end.getDate()}, ${end.getFullYear()}`;
  } else if (sameYear) {
    endStr = `${MON_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  } else {
    endStr = `${MON_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startStr} – ${endStr}`;
}

export function weekDays(startIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(startIso, i));
}

export function isFuture(iso) {
  return iso > todayISO();
}

export function isSameDay(a, b) { return a === b; }

// h:mm -> minutes. Returns { minutes, valid }.
export function parseStudyTime(str) {
  str = str.trim();
  if (str === '') return { minutes: null, valid: true };
  const m = str.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!m) return { minutes: null, valid: false };
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (mm >= 60) return { minutes: null, valid: false };
  return { minutes: h * 60 + mm, valid: true };
}

export function formatStudyTime(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function formatStudyTimeShort(minutes) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}

export function debounce(fn, ms) {
  let t = null;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Day completion status for report dots: 'complete' | 'partial' | 'missing'
export function dayStatus(record) {
  if (!record) return 'missing';
  const fields = [record.weight, record.creatine, record.studyTimeMinutes, record.steps, record.dayRating];
  const boolFields = [record.madeBed, record.skinCare, record.magnesium];
  const filledCount = fields.filter((v) => v !== null && v !== undefined).length + boolFields.filter(Boolean).length;
  const total = fields.length + boolFields.length;
  if (filledCount === 0) return 'missing';
  if (filledCount === total) return 'complete';
  return 'partial';
}

// Whether a record has any logged data at all (daily fields OR workout/cardio
// entries) — used to decide if a week is worth exporting, distinct from
// dayStatus() which only judges the 8 daily-tracker fields for the
// missing-data warning (a rest day, i.e. empty workout/cardio, is never
// "missing" on its own).
export function hasAnyRecordData(record) {
  if (!record) return false;
  const fields = [record.weight, record.creatine, record.studyTimeMinutes, record.steps, record.dayRating];
  const boolFields = [record.madeBed, record.skinCare, record.magnesium];
  if (fields.some((v) => v !== null && v !== undefined)) return true;
  if (boolFields.some(Boolean)) return true;
  if ((record.exercises || []).length) return true;
  if ((record.cardioSessions || []).length) return true;
  return false;
}
