// IndexedDB data layer for the Daily Tracker app.

const DB_NAME = 'daily-tracker';
const DB_VERSION = 1;

let _dbPromise = null;

function openDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore('records', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  async getRecord(date) {
    const store = await tx('records', 'readonly');
    return reqToPromise(store.get(date));
  },
  async putRecord(record) {
    const store = await tx('records', 'readwrite');
    return reqToPromise(store.put(record));
  },
  async getAllRecords() {
    const store = await tx('records', 'readonly');
    return reqToPromise(store.getAll());
  },
  async getLibrary() {
    const store = await tx('library', 'readonly');
    return reqToPromise(store.getAll());
  },
  async putLibraryExercise(ex) {
    const store = await tx('library', 'readwrite');
    return reqToPromise(store.put(ex));
  },
  async deleteLibraryExercise(id) {
    const store = await tx('library', 'readwrite');
    return reqToPromise(store.delete(id));
  },
  async getMeta(key, fallback) {
    const store = await tx('meta', 'readonly');
    const v = await reqToPromise(store.get(key));
    return v ? v.value : fallback;
  },
  async setMeta(key, value) {
    const store = await tx('meta', 'readwrite');
    return reqToPromise(store.put({ key, value }));
  },
};

function uid(prefix) {
  const rand = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 10);
  return `${prefix}_${rand}`;
}

export async function seedDefaultLibrary() {
  const seeded = await db.getMeta('librarySeeded', false);
  if (seeded) return;
  const strength = ['Pull Ups', 'Dips', 'Squat', 'Leg Extension', 'Leg Curl', 'Lat Raises', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Curl', 'Plank'];
  const cardio = ['Running', 'Cycling', 'Swimming', 'Rowing', 'Elliptical', 'Stair Climber'];
  for (const name of strength) {
    await db.putLibraryExercise({ id: uid('ex'), name, category: 'strength' });
  }
  for (const name of cardio) {
    await db.putLibraryExercise({ id: uid('ex'), name, category: 'cardio' });
  }
  await db.setMeta('librarySeeded', true);
}

export function emptyRecord(date) {
  return {
    date,
    weight: null,
    madeBed: false,
    creatine: null,
    studyTimeMinutes: null,
    skinCare: false,
    steps: null,
    magnesium: false,
    dayRating: null,
    workout: false,
    exercises: [],
    cardio: false,
    cardioSessions: [],
  };
}

export { uid };
