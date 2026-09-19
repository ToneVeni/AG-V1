import { db, seedDefaultLibrary } from './db.js';
import { state } from './state.js';
import { registerScreen, setScreen, enableSwipeBack } from './router.js';
import { initHome } from './screens/home.js';
import { initMenu } from './screens/menu.js';
import { initLibrary } from './screens/library.js';
import { initReport } from './screens/report.js';

async function boot() {
  await seedDefaultLibrary();
  state.library = await db.getLibrary();
  state.fileType = await db.getMeta('fileType', 'json');
  state.downloadedWeeks = await db.getMeta('downloadedWeeks', []);

  registerScreen('home', initHome);
  registerScreen('menu', initMenu);
  registerScreen('library', initLibrary);
  registerScreen('report', initReport);

  // Edge-swipe from the left on Week Report / Exercise Library drills back to Menu.
  enableSwipeBack('library', 'menu');
  enableSwipeBack('report', 'menu');

  await setScreen('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();
