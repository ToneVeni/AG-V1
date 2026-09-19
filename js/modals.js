import { db, uid } from './db.js';
import { state } from './state.js';
import { openModal, closeModal, modalCloseBtn, wireModalClose, renderSelect, wireSelect, showToast } from './components.js';
import { ICON } from './icons.js';
import { escapeHtml } from './utils.js';

async function safeSave(record, onSaved, retryFn) {
  try {
    await db.putRecord(record);
    onSaved && onSaved();
  } catch (err) {
    showToast({ kind: 'failed', text: "Couldn't save · Retry", onRetry: retryFn });
  }
}

function libraryByCategory(category) {
  return state.library
    .filter((e) => e.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- Add Exercise ----------

export function openAddExerciseModal(record, onSaved) {
  const options = libraryByCategory('strength').map((e) => ({ value: e.id, label: e.name }));
  let selectedId = options[0] ? options[0].value : null;

  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Add Exercise</div>
    <div class="modal-subtitle">Workout</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Exercise</div>
      ${options.length ? renderSelect({ id: 'ex-select', value: selectedId, options }) : `<div style="color:var(--text-faint);font-size:13px;">No strength exercises in your library yet. Add one from the Exercise Library first.</div>`}
    </div>
    ${options.length ? `
    <div class="field-row-2">
      <div class="field-group">
        <div class="field-group-label">Reps</div>
        <input type="text" inputmode="numeric" class="text-input" id="ex-reps" placeholder="8" />
      </div>
      <div class="field-group">
        <div class="field-group-label">Sets</div>
        <input type="text" inputmode="numeric" class="text-input" id="ex-sets" placeholder="3" />
      </div>
    </div>
    <div class="field-group">
      <div class="field-group-label">Weight (kg)</div>
      <input type="text" inputmode="decimal" class="text-input" id="ex-weight" placeholder="20" />
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-cancel" id="ex-cancel">Cancel</button>
      ${options.length ? '<button class="btn btn-primary" id="ex-confirm">Add Exercise</button>' : ''}
    </div>`;

  openModal(html);
  wireModalClose();
  if (!options.length) {
    document.getElementById('ex-cancel').addEventListener('click', closeModal);
    return;
  }
  wireSelect('ex-select', (v) => { selectedId = v; });
  document.getElementById('ex-cancel').addEventListener('click', closeModal);
  document.getElementById('ex-confirm').addEventListener('click', async () => {
    const reps = parseInt(document.getElementById('ex-reps').value, 10);
    const sets = parseInt(document.getElementById('ex-sets').value, 10) || 1;
    const weight = parseFloat(document.getElementById('ex-weight').value) || 0;
    if (!selectedId || !reps) { closeModal(); return; }
    const libEx = state.library.find((e) => e.id === selectedId);
    const newSets = Array.from({ length: sets }, () => ({ reps, weightKg: weight }));
    record.exercises.push({ exerciseId: selectedId, exerciseName: libEx ? libEx.name : 'Unknown Exercise', sets: newSets });
    if (!record.workout) record.workout = true;
    closeModal();
    await safeSave(record, onSaved, () => openAddExerciseModal(record, onSaved));
  });
}

// ---------- Add Set (to an existing exercise) ----------

export function openAddSetModal(record, exIndex, onSaved) {
  const ex = record.exercises[exIndex];
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Add Set</div>
    <div class="modal-subtitle">${escapeHtml(ex.exerciseName || 'Exercise')}</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Reps</div>
      <input type="text" inputmode="numeric" class="text-input" id="set-reps" placeholder="8" />
    </div>
    <div class="field-group">
      <div class="field-group-label">Sets</div>
      <input type="text" inputmode="numeric" class="text-input" id="set-count" placeholder="3" />
      <div class="field-group-hint">Number of sets at this reps &amp; weight</div>
    </div>
    <div class="field-group">
      <div class="field-group-label">Weight (kg)</div>
      <input type="text" inputmode="decimal" class="text-input" id="set-weight" placeholder="22.5" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="set-cancel">Cancel</button>
      <button class="btn btn-primary" id="set-confirm">Add Set</button>
    </div>`;
  openModal(html);
  wireModalClose();
  document.getElementById('set-cancel').addEventListener('click', closeModal);
  document.getElementById('set-confirm').addEventListener('click', async () => {
    const reps = parseInt(document.getElementById('set-reps').value, 10);
    const count = parseInt(document.getElementById('set-count').value, 10) || 1;
    const weight = parseFloat(document.getElementById('set-weight').value) || 0;
    if (!reps) { closeModal(); return; }
    for (let i = 0; i < count; i++) ex.sets.push({ reps, weightKg: weight });
    closeModal();
    await safeSave(record, onSaved, () => openAddSetModal(record, exIndex, onSaved));
  });
}

// ---------- Edit Set ----------

export function openEditSetModal(record, exIndex, setIndex, onSaved) {
  const ex = record.exercises[exIndex];
  const set = ex.sets[setIndex];
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Edit Set</div>
    <div class="modal-subtitle">${escapeHtml(ex.exerciseName || 'Exercise')}</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Reps</div>
      <input type="text" inputmode="numeric" class="text-input" id="editset-reps" value="${set.reps}" />
    </div>
    <div class="field-group">
      <div class="field-group-label">Sets</div>
      <input type="text" inputmode="numeric" class="text-input" id="editset-count" value="1" />
      <div class="field-group-hint">Number of sets at this reps &amp; weight</div>
    </div>
    <div class="field-group">
      <div class="field-group-label">Weight (kg)</div>
      <input type="text" inputmode="decimal" class="text-input" id="editset-weight" value="${set.weightKg}" />
    </div>
    <button class="delete-link" id="editset-delete">${ICON.trash} Delete this entry</button>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="editset-cancel">Cancel</button>
      <button class="btn btn-primary" id="editset-save">Save</button>
    </div>`;
  openModal(html);
  wireModalClose();
  document.getElementById('editset-cancel').addEventListener('click', closeModal);
  document.getElementById('editset-delete').addEventListener('click', async () => {
    ex.sets.splice(setIndex, 1);
    if (ex.sets.length === 0) record.exercises.splice(exIndex, 1);
    if (record.exercises.length === 0) record.workout = false;
    closeModal();
    await safeSave(record, onSaved, () => {});
  });
  document.getElementById('editset-save').addEventListener('click', async () => {
    const reps = parseInt(document.getElementById('editset-reps').value, 10) || set.reps;
    const count = parseInt(document.getElementById('editset-count').value, 10) || 1;
    const weight = parseFloat(document.getElementById('editset-weight').value);
    const weightKg = isNaN(weight) ? set.weightKg : weight;
    const newSets = Array.from({ length: count }, () => ({ reps, weightKg }));
    ex.sets.splice(setIndex, 1, ...newSets);
    closeModal();
    await safeSave(record, onSaved, () => openEditSetModal(record, exIndex, setIndex, onSaved));
  });
}

// ---------- Add Cardio Session ----------

export function openAddCardioModal(record, onSaved) {
  const options = libraryByCategory('cardio').map((e) => ({ value: e.name, label: e.name }));
  let selectedType = options[0] ? options[0].value : null;
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Add Session</div>
    <div class="modal-subtitle">Cardio</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Type</div>
      ${options.length ? renderSelect({ id: 'cardio-type', value: selectedType, options }) : `<div style="color:var(--text-faint);font-size:13px;">No cardio exercises in your library yet. Add one from the Exercise Library first.</div>`}
    </div>
    ${options.length ? `
    <div class="field-row-2">
      <div class="field-group">
        <div class="field-group-label">Distance (km)</div>
        <input type="text" inputmode="decimal" class="text-input" id="cardio-distance" placeholder="5.2" />
      </div>
      <div class="field-group">
        <div class="field-group-label">Duration (min)</div>
        <input type="text" inputmode="numeric" class="text-input" id="cardio-duration" placeholder="28" />
      </div>
    </div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-cancel" id="cardio-cancel">Cancel</button>
      ${options.length ? '<button class="btn btn-primary" id="cardio-confirm">Add Session</button>' : ''}
    </div>`;
  openModal(html);
  wireModalClose();
  document.getElementById('cardio-cancel').addEventListener('click', closeModal);
  if (!options.length) return;
  wireSelect('cardio-type', (v) => { selectedType = v; });
  document.getElementById('cardio-confirm').addEventListener('click', async () => {
    const distanceKm = parseFloat(document.getElementById('cardio-distance').value) || 0;
    const durationMinutes = parseInt(document.getElementById('cardio-duration').value, 10) || 0;
    if (!selectedType || (!distanceKm && !durationMinutes)) { closeModal(); return; }
    record.cardioSessions.push({ id: uid('cs'), type: selectedType, distanceKm, durationMinutes });
    if (!record.cardio) record.cardio = true;
    closeModal();
    await safeSave(record, onSaved, () => openAddCardioModal(record, onSaved));
  });
}

// ---------- Edit Cardio Session ----------

export function openEditCardioModal(record, sessionIndex, onSaved) {
  const session = record.cardioSessions[sessionIndex];
  const options = libraryByCategory('cardio').map((e) => ({ value: e.name, label: e.name }));
  let selectedType = session.type;
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Edit Session</div>
    <div class="modal-subtitle">${escapeHtml(session.type)}</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Type</div>
      ${renderSelect({ id: 'editcardio-type', value: selectedType, options })}
    </div>
    <div class="field-row-2">
      <div class="field-group">
        <div class="field-group-label">Distance (km)</div>
        <input type="text" inputmode="decimal" class="text-input" id="editcardio-distance" value="${session.distanceKm}" />
      </div>
      <div class="field-group">
        <div class="field-group-label">Duration (min)</div>
        <input type="text" inputmode="numeric" class="text-input" id="editcardio-duration" value="${session.durationMinutes}" />
      </div>
    </div>
    <button class="delete-link" id="editcardio-delete">${ICON.trash} Delete this entry</button>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="editcardio-cancel">Cancel</button>
      <button class="btn btn-primary" id="editcardio-save">Save</button>
    </div>`;
  openModal(html);
  wireModalClose();
  wireSelect('editcardio-type', (v) => { selectedType = v; });
  document.getElementById('editcardio-cancel').addEventListener('click', closeModal);
  document.getElementById('editcardio-delete').addEventListener('click', async () => {
    record.cardioSessions.splice(sessionIndex, 1);
    if (record.cardioSessions.length === 0) record.cardio = false;
    closeModal();
    await safeSave(record, onSaved, () => {});
  });
  document.getElementById('editcardio-save').addEventListener('click', async () => {
    const distanceKm = parseFloat(document.getElementById('editcardio-distance').value) || 0;
    const durationMinutes = parseInt(document.getElementById('editcardio-duration').value, 10) || 0;
    session.type = selectedType;
    session.distanceKm = distanceKm;
    session.durationMinutes = durationMinutes;
    closeModal();
    await safeSave(record, onSaved, () => openEditCardioModal(record, sessionIndex, onSaved));
  });
}

// ---------- Exercise Library: action menu (Edit Name / Delete / Cancel) ----------

export function openExerciseActionModal(libEx, { onRename, onDelete }) {
  const html = `
    <div class="action-modal">
      <div class="action-modal-title">${escapeHtml(libEx.name)}</div>
      <button class="action-modal-option" id="action-edit">Edit Name</button>
      <button class="action-modal-option danger" id="action-delete">Delete</button>
      <button class="action-modal-cancel" id="action-cancel">Cancel</button>
    </div>`;
  openModal(html);
  document.getElementById('action-cancel').addEventListener('click', closeModal);
  document.getElementById('action-edit').addEventListener('click', () => { closeModal(); setTimeout(() => onRename(), 180); });
  document.getElementById('action-delete').addEventListener('click', () => { closeModal(); setTimeout(() => onDelete(), 180); });
}

// ---------- Rename exercise ----------

export function openRenameExerciseModal(libEx, onSaved) {
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Rename Exercise</div>
    <div class="modal-subtitle">Exercise Library</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Name</div>
      <input type="text" class="text-input" id="rename-input" value="${escapeHtml(libEx.name)}" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="rename-cancel">Cancel</button>
      <button class="btn btn-primary" id="rename-save">Save</button>
    </div>`;
  openModal(html);
  wireModalClose();
  document.getElementById('rename-cancel').addEventListener('click', closeModal);
  document.getElementById('rename-save').addEventListener('click', async () => {
    const name = document.getElementById('rename-input').value.trim();
    if (!name) { closeModal(); return; }
    libEx.name = name;
    await db.putLibraryExercise(libEx);
    closeModal();
    onSaved && onSaved();
  });
}

// ---------- Delete exercise confirmation ----------

export function openDeleteExerciseConfirmModal(libEx, onDeleted) {
  const html = `
    <div class="modal-center">
      <div class="modal-icon-alert">${ICON.alertCircle}</div>
      <div class="modal-title-center">Delete Exercise?</div>
      <div class="modal-accent-name">${escapeHtml(libEx.name)}</div>
      <div class="modal-body-text">It will no longer appear when adding a new exercise. Past logged sets for it are kept in your history.</div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="delete-cancel">Cancel</button>
      <button class="btn btn-danger" id="delete-confirm">Delete</button>
    </div>`;
  openModal(html);
  document.getElementById('delete-cancel').addEventListener('click', closeModal);
  document.getElementById('delete-confirm').addEventListener('click', async () => {
    await db.deleteLibraryExercise(libEx.id);
    closeModal();
    onDeleted && onDeleted();
  });
}

// ---------- Add New Exercise (library) ----------

export function openAddNewExerciseModal(defaultCategory, onSaved) {
  let category = defaultCategory || 'strength';
  const html = `
    ${modalCloseBtn()}
    <div class="modal-title">Add New Exercise</div>
    <div class="modal-subtitle">Exercise Library</div>
    <div class="modal-divider"></div>
    <div class="field-group">
      <div class="field-group-label">Name</div>
      <input type="text" class="text-input" id="newex-name" placeholder="e.g. Romanian Deadlift" />
    </div>
    <div class="field-group">
      <div class="field-group-label">Category</div>
      <div class="segmented" id="newex-category" style="width:100%;">
        <button data-v="strength" class="${category === 'strength' ? 'active' : ''}" style="flex:1;">Strength</button>
        <button data-v="cardio" class="${category === 'cardio' ? 'active' : ''}" style="flex:1;">Cardio</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="newex-cancel">Cancel</button>
      <button class="btn btn-primary" id="newex-add">Add</button>
    </div>`;
  openModal(html);
  wireModalClose();
  const catButtons = document.querySelectorAll('#newex-category button');
  catButtons.forEach((b) => b.addEventListener('click', () => {
    category = b.dataset.v;
    catButtons.forEach((x) => x.classList.toggle('active', x === b));
  }));
  document.getElementById('newex-cancel').addEventListener('click', closeModal);
  document.getElementById('newex-add').addEventListener('click', async () => {
    const name = document.getElementById('newex-name').value.trim();
    if (!name) { closeModal(); return; }
    await db.putLibraryExercise({ id: uid('ex'), name, category });
    closeModal();
    onSaved && onSaved();
  });
}

// ---------- Missing data warning ----------

export function openMissingDataModal(missingDays, { onFillIn, onExportAnyway }) {
  const list = missingDays.length === 1
    ? `${missingDays[0]} is missing data.`
    : missingDays.length === 2
      ? `${missingDays[0]} and ${missingDays[1]} are missing data.`
      : `${missingDays.slice(0, -1).join(', ')}, and ${missingDays[missingDays.length - 1]} are missing data.`;
  const html = `
    <div class="modal-center">
      <div class="modal-icon-alert amber">${ICON.alertCircle}</div>
      <div class="modal-title-center">Missing Data</div>
      <div class="modal-body-text" style="margin-bottom:4px;">${escapeHtml(list)}</div>
      <div class="modal-body-text">Fill them in, or export anyway?</div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-cancel" id="missing-fillin">Fill In</button>
      <button class="btn btn-primary" id="missing-export">Export Anyway</button>
    </div>`;
  openModal(html);
  document.getElementById('missing-fillin').addEventListener('click', () => { closeModal(); onFillIn && onFillIn(); });
  document.getElementById('missing-export').addEventListener('click', () => { closeModal(); onExportAnyway && onExportAnyway(); });
}
