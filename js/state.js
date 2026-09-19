import { todayISO } from './utils.js';

export const state = {
  currentDate: todayISO(),
  screen: 'home', // 'home' | 'menu' | 'library' | 'report'
  reportView: 'list', // 'list' | 'preview'
  previewWeekStart: null,
  record: null, // current day's DailyRecord
  library: [], // cached LibraryExercise[]
  fileType: 'json',
  downloadedWeeks: [], // array of week-start ISO strings
  pendingExportWeekStart: null, // week awaiting missing-data confirmation
};
