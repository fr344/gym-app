// ── Manual Program Builder ────────────────────────────────────────────────────

let _b = null; // builder state

function freshBuilderState() {
  return {
    name: '',
    activeDay: 0,
    days: [{ id: DB.generateId(), name: 'Day 1', exercises: [] }],
  };
}

async function renderBuilder(container, params = {}) {
  if (params.edit) {
    const prog = params.edit;
    _b = {
      id: prog.id,           // keep existing ID so we update in place
      name: prog.name,
      activeDay: 0,
      isEdit: true,
      existingSchedule: params.schedule || null,
      days: prog.days.map(d => ({
        ...d,
        exercises: d.exercises.map(e => ({ ...e })),
      })),
    };
  } else {
    _b = freshBuilderState();
  }
  _renderBuilderUI(container);
}

// ── Main UI ───────────────────────────────────────────────────────────────────
function _renderBuilderUI(container) {
  const day = _b.days[_b.activeDay];
  const measurements = _calcMeasurements();

  container.innerHTML = `
    <div class="view" id="builder-root">

      <!-- Header -->
      <div class="workout-header" style="padding-top:52px">
        <input class="form-input" id="prog-name-input"
          placeholder="Program name…"
          value="${escHtml(_b.name)}"
          style="background:transparent;border:none;border-bottom:1px solid var(--border);
                 border-radius:0;padding:0 0 8px;font-size:20px;font-weight:700;margin-bottom:12px" />

        <!-- Day tabs -->
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none" id="day-tabs">
          ${_b.days.map((d, i) => `
            <button class="day-tab-btn ${i === _b.activeDay ? 'active-tab' : ''}"
              data-idx="${i}"
              style="flex-shrink:0;padding:6px 14px;border-radius:20px;border:1px solid var(--border);
                     background:${i === _b.activeDay ? 'var(--accent)' : 'var(--surface2)'};
                     color:${i === _b.activeDay ? '#000' : 'var(--muted)'};
                     font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">
              ${escHtml(d.name)}
            </button>`).join('')}
          <button id="add-day-btn"
            style="flex-shrink:0;padding:6px 14px;border-radius:20px;border:1px dashed var(--border);
                   background:none;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer">
            + Day
          </button>
        </div>
      </div>

      <!-- Active day content -->
      <div id="day-content">
        ${_renderDayContent(day, _b.activeDay)}
      </div>

      <!-- Live Measurements -->
      <div class="section-label">Live Estimates</div>
      <div class="card" id="measurements-card">
        ${_renderMeasurements(measurements)}
      </div>

      <!-- Save -->
      <div class="px-16 mt-16" style="display:flex;flex-direction:column;gap:10px;padding-bottom:32px">
        <button class="btn btn-primary" id="save-program-btn">${_b.isEdit ? 'Save Changes' : 'Save Program'}</button>
        <button class="btn btn-ghost" onclick="navigate('program')">Cancel</button>
      </div>
    </div>

    <!-- Exercise Picker Modal (hidden) -->
    <div id="picker-modal" style="display:none;position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column">
      ${_renderPickerModal()}
    </div>`;

  // Hide modal initially
  container.querySelector('#picker-modal').style.display = 'none';

  _attachBuilderListeners(container);
}

// ── Day Content ───────────────────────────────────────────────────────────────
function _renderDayContent(day, dayIdx) {
  const exerciseRows = day.exercises.length
    ? day.exercises.map((ex, exIdx) => _renderExerciseRow(ex, dayIdx, exIdx)).join('')
    : `<div style="padding:24px 0;text-align:center;color:var(--muted);font-size:14px">
         No exercises yet — tap Add Exercise
       </div>`;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 8px">
      <input class="form-input" id="day-name-input"
        value="${escHtml(day.name)}"
        placeholder="Day name…"
        style="background:transparent;border:none;border-bottom:1px solid var(--border);
               border-radius:0;padding:0 0 6px;font-size:16px;font-weight:600;flex:1;margin-right:12px" />
      <button id="copy-day-btn" class="btn btn-sm btn-ghost" style="flex-shrink:0">Copy Day</button>
      ${_b.days.length > 1
        ? `<button id="delete-day-btn" class="btn btn-sm btn-danger" style="flex-shrink:0;margin-left:6px">Delete</button>`
        : ''}
    </div>

    <div class="card" style="padding:0 16px">
      <div id="exercise-list" style="min-height:40px">
        ${exerciseRows}
      </div>
    </div>

    <div class="px-16 mt-16" style="display:flex;gap:8px">
      <button class="btn btn-secondary" id="add-exercise-btn" style="flex:1">+ Add Exercise</button>
    </div>`;
}

function _renderExerciseRow(ex, dayIdx, exIdx) {
  return `
    <div class="exercise-build-row" data-ex-idx="${exIdx}"
      style="display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:start;
             padding:12px 0;border-bottom:1px solid var(--border)">

      <!-- Drag handle -->
      <div class="drag-handle" style="display:flex;flex-direction:column;align-items:center;
           justify-content:center;gap:3px;padding-top:14px;cursor:grab;touch-action:none">
        <span style="display:block;width:16px;height:2px;background:var(--border);border-radius:2px"></span>
        <span style="display:block;width:16px;height:2px;background:var(--border);border-radius:2px"></span>
        <span style="display:block;width:16px;height:2px;background:var(--border);border-radius:2px"></span>
      </div>

      <div>
        <!-- Name + info -->
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:14px;font-weight:600">${escHtml(ex.name)}</span>
          ${ex.cue ? `
            <button class="info-btn" data-cue="${escHtml(ex.cue)}"
              style="width:18px;height:18px;border-radius:50%;border:1px solid var(--border);
                     background:none;color:var(--muted);font-size:10px;font-weight:700;
                     cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center">i</button>` : ''}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${ex.muscleGroup}</div>

        <!-- Sets / Reps / Weight inline -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:3px;text-transform:uppercase;font-weight:600">Sets</div>
            <input class="set-input ex-field" type="number" inputmode="numeric"
              value="${ex.sets}" data-field="sets" data-ex="${exIdx}"
              style="font-size:15px;padding:7px 4px" />
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:3px;text-transform:uppercase;font-weight:600">Reps</div>
            <input class="set-input ex-field" type="text" inputmode="text"
              value="${escHtml(ex.reps)}" data-field="reps" data-ex="${exIdx}"
              style="font-size:15px;padding:7px 4px" />
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:3px;text-transform:uppercase;font-weight:600">kg</div>
            <input class="set-input ex-field" type="number" inputmode="decimal"
              value="${ex.weight}" data-field="weight" data-ex="${exIdx}"
              style="font-size:15px;padding:7px 4px" />
          </div>
        </div>
      </div>

      <!-- Remove -->
      <button class="remove-ex-btn" data-ex="${exIdx}"
        style="padding:4px 8px;border:none;background:none;color:var(--muted);
               font-size:20px;cursor:pointer;line-height:1;margin-top:10px">×</button>
    </div>`;
}

// ── Measurements ──────────────────────────────────────────────────────────────
function _calcMeasurements() {
  // Duration: per-day, and total weekly
  const dayDurations = _b.days.map(day => {
    const totalSets = day.exercises.reduce((s, ex) => s + (parseInt(ex.sets) || 0), 0);
    return 5 + totalSets * 3; // 5min warm-up + 3min per set (set + transition)
  });

  // Volume per muscle group (sets/week summed across all days)
  const muscleVolume = {};
  _b.days.forEach(day => {
    day.exercises.forEach(ex => {
      const sets = parseInt(ex.sets) || 0;
      muscleVolume[ex.muscleGroup] = (muscleVolume[ex.muscleGroup] || 0) + sets;
    });
  });

  // Push/pull balance (sets)
  let pushSets = 0, pullSets = 0;
  _b.days.forEach(day => {
    day.exercises.forEach(ex => {
      const sets = parseInt(ex.sets) || 0;
      const libEx = EXERCISES.find(e => e.id === ex.id);
      if (libEx?.pattern === 'push') pushSets += sets;
      if (libEx?.pattern === 'pull') pullSets += sets;
    });
  });

  // Muscle frequency (days per week each muscle appears)
  const muscleFreq = {};
  _b.days.forEach(day => {
    const seen = new Set();
    day.exercises.forEach(ex => {
      if (!seen.has(ex.muscleGroup)) {
        muscleFreq[ex.muscleGroup] = (muscleFreq[ex.muscleGroup] || 0) + 1;
        seen.add(ex.muscleGroup);
      }
    });
  });

  return { dayDurations, muscleVolume, pushSets, pullSets, muscleFreq };
}

function _renderMeasurements(m) {
  const { dayDurations, muscleVolume, pushSets, pullSets, muscleFreq } = m;

  // Duration per day
  const durationRows = _b.days.map((d, i) => {
    const mins = dayDurations[i];
    const flag = mins > 75 ? '⚠ over 1hr' : '';
    return `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px">
      <span style="color:var(--muted)">${escHtml(d.name)}</span>
      <span style="font-weight:600;color:${mins > 75 ? 'var(--red)' : 'var(--text)'}">${mins}min ${flag}</span>
    </div>`;
  }).join('');

  // Volume per muscle
  const muscleRows = Object.entries(muscleVolume)
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, sets]) => {
      const freq = muscleFreq[muscle] || 0;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px">
        <span style="color:var(--muted)">${muscle}</span>
        <span style="color:var(--text);font-weight:600">${sets} sets &nbsp;<span style="color:var(--muted);font-weight:400">${freq}×/wk</span></span>
      </div>`;
    }).join('') || `<div style="color:var(--muted);font-size:13px">Add exercises to see volume</div>`;

  // Push/pull balance
  const total = pushSets + pullSets;
  const pushPct = total ? Math.round((pushSets / total) * 100) : 50;
  const pullPct = total ? 100 - pushPct : 50;
  const balanceColor = Math.abs(pushPct - pullPct) > 20 ? 'var(--red)' : 'var(--green)';

  return `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Estimated Duration</div>
      ${durationRows}
    </div>
    <div style="height:1px;background:var(--border);margin:8px 0 14px"></div>
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px">Weekly Volume</div>
      ${muscleRows}
    </div>
    <div style="height:1px;background:var(--border);margin:8px 0 14px"></div>
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px">Push / Pull Balance</div>
      <div style="display:flex;border-radius:6px;overflow:hidden;height:8px;margin-bottom:6px">
        <div style="width:${pushPct}%;background:var(--accent);transition:width .3s"></div>
        <div style="width:${pullPct}%;background:var(--border)"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px">
        <span style="color:var(--muted)">Push ${pushSets} sets (${pushPct}%)</span>
        <span style="color:${balanceColor};font-weight:600">${Math.abs(pushPct - pullPct) > 20 ? 'Unbalanced' : 'Balanced'}</span>
        <span style="color:var(--muted)">Pull ${pullSets} sets (${pullPct}%)</span>
      </div>
    </div>`;
}

// ── Exercise Picker Modal ─────────────────────────────────────────────────────
function _renderPickerModal() {
  const muscleOptions = MUSCLE_GROUPS.map(m =>
    `<option value="${m}">${m}</option>`).join('');
  const equipOptions = EQUIPMENT_TYPES.map(e =>
    `<option value="${e}">${e.charAt(0).toUpperCase() + e.slice(1)}</option>`).join('');

  return `
    <div style="background:var(--surface);border-bottom:1px solid var(--border);padding:52px 16px 12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <input id="picker-search" class="form-input" placeholder="Search exercises…" style="flex:1" />
        <button id="picker-close" style="background:none;border:none;color:var(--muted);font-size:24px;cursor:pointer;padding:0 4px">×</button>
      </div>
      <div style="display:flex;gap:8px">
        <select id="picker-muscle" class="form-select" style="flex:1;padding:9px 32px 9px 12px;font-size:13px">
          <option value="">All muscles</option>
          ${muscleOptions}
        </select>
        <select id="picker-equip" class="form-select" style="flex:1;padding:9px 32px 9px 12px;font-size:13px">
          <option value="">All equipment</option>
          ${equipOptions}
        </select>
      </div>
    </div>
    <div id="picker-list" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch"></div>`;
}

function _renderPickerList(container) {
  const query = container.querySelector('#picker-search')?.value || '';
  const muscle = container.querySelector('#picker-muscle')?.value || '';
  const equip = container.querySelector('#picker-equip')?.value || '';

  const results = searchExercises({ query, muscleGroup: muscle, equipment: equip });
  const list = container.querySelector('#picker-list');
  if (!list) return;

  const rows = results.map(ex => `
    <div class="picker-row" data-id="${ex.id}"
      style="display:flex;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;gap:12px">
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:500">${escHtml(ex.name)}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">
          ${ex.muscleGroup} · ${ex.equipment.join(', ')}
        </div>
      </div>
      <svg viewBox="0 0 24 24" width="18" height="18"
        style="stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>`).join('');

  // "Create New" entry at bottom
  const createNew = `
    <div id="create-new-row"
      style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border);cursor:pointer;gap:12px">
      <div style="flex:1">
        <div style="font-size:15px;font-weight:600;color:var(--accent)">+ Create Custom Exercise</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">Add your own to the list</div>
      </div>
    </div>`;

  list.innerHTML = rows + createNew;

  // Tap a library exercise → add it
  list.querySelectorAll('.picker-row').forEach(row => {
    row.addEventListener('click', () => {
      const ex = EXERCISES.find(e => e.id === row.dataset.id);
      if (ex) _addExerciseToDay(ex, container);
    });
  });

  // Create custom
  list.querySelector('#create-new-row')?.addEventListener('click', () => {
    _showCreateCustom(container);
  });
}

function _showCreateCustom(container) {
  const list = container.querySelector('#picker-list');
  const muscleOptions = MUSCLE_GROUPS.map(m =>
    `<option value="${m}">${m}</option>`).join('');

  list.innerHTML = `
    <div style="padding:20px 16px">
      <button onclick="" id="back-to-list" style="background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;padding:0;margin-bottom:20px">← Back</button>
      <div class="form-group" style="margin:0 0 16px">
        <label class="form-label">Exercise Name</label>
        <input class="form-input" id="custom-name" placeholder="e.g. Cable Pull-Through" />
      </div>
      <div class="form-group" style="margin:0 0 16px">
        <label class="form-label">Muscle Group</label>
        <select class="form-select" id="custom-muscle">
          ${muscleOptions}
        </select>
      </div>
      <div class="form-group" style="margin:0 0 16px">
        <label class="form-label">Form Cue (optional)</label>
        <input class="form-input" id="custom-cue" placeholder="Key technique note…" />
      </div>
      <button class="btn btn-primary" id="add-custom-btn">Add Exercise</button>
    </div>`;

  list.querySelector('#back-to-list').addEventListener('click', () => _renderPickerList(container));

  list.querySelector('#add-custom-btn').addEventListener('click', () => {
    const name = list.querySelector('#custom-name').value.trim();
    const muscle = list.querySelector('#custom-muscle').value;
    const cue = list.querySelector('#custom-cue').value.trim();
    if (!name) { alert('Enter an exercise name.'); return; }

    const customEx = {
      id: 'custom_' + DB.generateId(),
      name,
      muscleGroup: muscle,
      secondaryMuscles: [],
      equipment: [],
      pattern: 'push',
      cue,
      isCustom: true,
    };
    _addExerciseToDay(customEx, container);
  });
}

function _addExerciseToDay(libEx, container) {
  const day = _b.days[_b.activeDay];
  day.exercises.push({
    id: libEx.id,
    name: libEx.name,
    muscleGroup: libEx.muscleGroup,
    cue: libEx.cue || '',
    sets: 3,
    reps: '8-12',
    weight: 20,
  });
  _closeModal(container);
  _refreshDayContent(container);
  _refreshMeasurements(container);
}

// ── Drag to Reorder ───────────────────────────────────────────────────────────
function _initDragReorder(container) {
  const list = container.querySelector('#exercise-list');
  if (!list) return;

  let dragging = null, startY = 0, startScrollY = 0, placeholder = null;

  list.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('touchstart', e => {
      e.preventDefault();
      const row = handle.closest('.exercise-build-row');
      dragging = row;
      startY = e.touches[0].clientY;
      startScrollY = window.scrollY;

      // Visual feedback
      row.style.opacity = '0.4';
      row.style.background = 'var(--surface2)';

      // Create placeholder
      placeholder = document.createElement('div');
      placeholder.style.cssText = `height:${row.offsetHeight}px;border:2px dashed var(--border);border-radius:8px;margin:4px 0`;
      row.after(placeholder);
    }, { passive: false });
  });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();

    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    // Move dragging element
    dragging.style.position = 'relative';
    dragging.style.zIndex = '10';
    dragging.style.transform = `translateY(${delta}px)`;

    // Find which row we're hovering over
    const rows = [...list.querySelectorAll('.exercise-build-row:not([data-dragging])')];
    const overRow = rows.find(r => {
      if (r === dragging) return false;
      const rect = r.getBoundingClientRect();
      return currentY > rect.top && currentY < rect.bottom;
    });

    if (overRow) {
      const rect = overRow.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (currentY < midpoint) {
        overRow.before(placeholder);
      } else {
        overRow.after(placeholder);
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (!dragging) return;

    // Determine new index from placeholder position
    const rows = [...list.querySelectorAll('.exercise-build-row')];
    const oldIdx = parseInt(dragging.dataset.exIdx);
    let newIdx = rows.indexOf(dragging);

    // Reorder state
    const day = _b.days[_b.activeDay];
    const [moved] = day.exercises.splice(oldIdx, 1);

    // Find where placeholder is among non-dragging rows
    const allChildren = [...list.children];
    const phIdx = allChildren.indexOf(placeholder);
    const realRows = allChildren.filter(c => c.classList.contains('exercise-build-row') && c !== dragging);
    newIdx = phIdx !== -1 ? Math.min(phIdx, realRows.length) : realRows.length;
    // Adjust for the removed element
    const adjustedIdx = Math.min(newIdx, day.exercises.length);
    day.exercises.splice(adjustedIdx, 0, moved);

    dragging = null;
    _refreshDayContent(container);
    _refreshMeasurements(container);
  });
}

// ── Listeners ─────────────────────────────────────────────────────────────────
function _attachBuilderListeners(container) {
  // Program name
  container.querySelector('#prog-name-input').addEventListener('input', e => {
    _b.name = e.target.value;
  });

  // Day tabs
  container.querySelector('#day-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.day-tab-btn');
    if (btn) {
      _saveCurrentDayName(container);
      _b.activeDay = parseInt(btn.dataset.idx);
      _renderBuilderUI(container);
    }
  });

  // Add day
  container.querySelector('#add-day-btn').addEventListener('click', () => {
    _saveCurrentDayName(container);
    _b.days.push({ id: DB.generateId(), name: `Day ${_b.days.length + 1}`, exercises: [] });
    _b.activeDay = _b.days.length - 1;
    _renderBuilderUI(container);
  });

  // Day name input
  container.querySelector('#day-name-input')?.addEventListener('input', e => {
    _b.days[_b.activeDay].name = e.target.value;
    // Update tab label live
    const tab = container.querySelector(`.day-tab-btn[data-idx="${_b.activeDay}"]`);
    if (tab) tab.textContent = e.target.value || `Day ${_b.activeDay + 1}`;
  });

  // Copy day
  container.querySelector('#copy-day-btn')?.addEventListener('click', () => {
    _saveCurrentDayName(container);
    const src = _b.days[_b.activeDay];
    const copy = {
      id: DB.generateId(),
      name: src.name + ' (copy)',
      exercises: src.exercises.map(ex => ({ ...ex })),
    };
    _b.days.push(copy);
    _b.activeDay = _b.days.length - 1;
    _renderBuilderUI(container);
  });

  // Delete day
  container.querySelector('#delete-day-btn')?.addEventListener('click', () => {
    if (!confirm(`Delete "${_b.days[_b.activeDay].name}"?`)) return;
    _b.days.splice(_b.activeDay, 1);
    _b.activeDay = Math.max(0, _b.activeDay - 1);
    _renderBuilderUI(container);
  });

  // Add exercise → open modal
  container.querySelector('#add-exercise-btn')?.addEventListener('click', () => {
    container.querySelector('#picker-modal').style.display = 'flex';
    container.querySelector('#picker-modal').style.flexDirection = 'column';
    container.querySelector('#picker-search').focus();
    _renderPickerList(container);
  });

  // Picker search + filters
  ['#picker-search', '#picker-muscle', '#picker-equip'].forEach(sel => {
    container.querySelector(sel)?.addEventListener('input', () => _renderPickerList(container));
    container.querySelector(sel)?.addEventListener('change', () => _renderPickerList(container));
  });

  // Close modal
  container.querySelector('#picker-close')?.addEventListener('click', () => _closeModal(container));

  // Exercise field edits
  container.querySelectorAll('.ex-field').forEach(input => {
    input.addEventListener('change', e => {
      const { field, ex } = e.target.dataset;
      const day = _b.days[_b.activeDay];
      day.exercises[parseInt(ex)][field] = field === 'reps' ? e.target.value : (parseFloat(e.target.value) || 0);
      _refreshMeasurements(container);
    });
  });

  // Remove exercise
  container.querySelectorAll('.remove-ex-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.ex);
      _b.days[_b.activeDay].exercises.splice(idx, 1);
      _refreshDayContent(container);
      _refreshMeasurements(container);
    });
  });

  // Info (i) buttons — show cue tooltip
  container.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const existing = container.querySelector('.cue-tooltip');
      if (existing) existing.remove();

      const tooltip = document.createElement('div');
      tooltip.className = 'cue-tooltip';
      tooltip.style.cssText = `position:fixed;bottom:calc(var(--nav-h) + 16px);left:16px;right:16px;
        background:var(--surface2);border:1px solid var(--border);border-radius:12px;
        padding:14px 16px;font-size:13px;line-height:1.6;color:var(--text);z-index:150;
        box-shadow:0 8px 32px rgba(0,0,0,.5)`;
      tooltip.innerHTML = `${escHtml(btn.dataset.cue)}
        <button onclick="this.parentElement.remove()" style="display:block;margin-top:10px;
          background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:0">Dismiss</button>`;
      container.appendChild(tooltip);
    });
  });

  // Drag reorder
  _initDragReorder(container);

  // Save program
  container.querySelector('#save-program-btn').onclick = () => _saveProgram(container);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _closeModal(container) {
  const modal = container.querySelector('#picker-modal');
  if (modal) modal.style.display = 'none';
}

function _saveCurrentDayName(container) {
  const inp = container.querySelector('#day-name-input');
  if (inp) _b.days[_b.activeDay].name = inp.value;
  const progInp = container.querySelector('#prog-name-input');
  if (progInp) _b.name = progInp.value;
}

function _refreshDayContent(container) {
  const day = _b.days[_b.activeDay];
  const el = container.querySelector('#day-content');
  if (el) el.innerHTML = _renderDayContent(day, _b.activeDay);
  _attachDayListeners(container);
  _initDragReorder(container);
}

function _refreshMeasurements(container) {
  const el = container.querySelector('#measurements-card');
  if (el) el.innerHTML = _renderMeasurements(_calcMeasurements());
}

function _attachDayListeners(container) {
  container.querySelector('#day-name-input')?.addEventListener('input', e => {
    _b.days[_b.activeDay].name = e.target.value;
    const tab = container.querySelector(`.day-tab-btn[data-idx="${_b.activeDay}"]`);
    if (tab) tab.textContent = e.target.value || `Day ${_b.activeDay + 1}`;
  });

  container.querySelector('#copy-day-btn')?.addEventListener('click', () => {
    _saveCurrentDayName(container);
    const src = _b.days[_b.activeDay];
    _b.days.push({ id: DB.generateId(), name: src.name + ' (copy)', exercises: src.exercises.map(ex => ({ ...ex })) });
    _b.activeDay = _b.days.length - 1;
    _renderBuilderUI(container);
  });

  container.querySelector('#delete-day-btn')?.addEventListener('click', () => {
    if (!confirm(`Delete "${_b.days[_b.activeDay].name}"?`)) return;
    _b.days.splice(_b.activeDay, 1);
    _b.activeDay = Math.max(0, _b.activeDay - 1);
    _renderBuilderUI(container);
  });

  container.querySelector('#add-exercise-btn')?.addEventListener('click', () => {
    container.querySelector('#picker-modal').style.display = 'flex';
    container.querySelector('#picker-modal').style.flexDirection = 'column';
    _renderPickerList(container);
  });

  container.querySelectorAll('.ex-field').forEach(input => {
    input.addEventListener('change', e => {
      const { field, ex } = e.target.dataset;
      const day = _b.days[_b.activeDay];
      day.exercises[parseInt(ex)][field] = field === 'reps' ? e.target.value : (parseFloat(e.target.value) || 0);
      _refreshMeasurements(container);
    });
  });

  container.querySelectorAll('.remove-ex-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _b.days[_b.activeDay].exercises.splice(parseInt(btn.dataset.ex), 1);
      _refreshDayContent(container);
      _refreshMeasurements(container);
    });
  });

  container.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const existing = container.querySelector('.cue-tooltip');
      if (existing) existing.remove();
      const tooltip = document.createElement('div');
      tooltip.className = 'cue-tooltip';
      tooltip.style.cssText = `position:fixed;bottom:calc(var(--nav-h) + 16px);left:16px;right:16px;
        background:var(--surface2);border:1px solid var(--border);border-radius:12px;
        padding:14px 16px;font-size:13px;line-height:1.6;color:var(--text);z-index:150;
        box-shadow:0 8px 32px rgba(0,0,0,.5)`;
      tooltip.innerHTML = `${escHtml(btn.dataset.cue)}
        <button onclick="this.parentElement.remove()" style="display:block;margin-top:10px;
          background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:0">Dismiss</button>`;
      container.appendChild(tooltip);
    });
  });
}

// ── Save Program ──────────────────────────────────────────────────────────────
async function _saveProgram(container) {
  _saveCurrentDayName(container);

  if (!_b.name.trim()) {
    alert('Give your program a name.');
    container.querySelector('#prog-name-input').focus();
    return;
  }
  if (_b.days.every(d => d.exercises.length === 0)) {
    alert('Add at least one exercise.');
    return;
  }

  // Show schedule assignment
  _showSchedulePicker(container);
}

function _showSchedulePicker(container) {
  const weekDays = ['mon','tue','wed','thu','fri','sat','sun'];
  const weekLabels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const existingSched = _b.existingSchedule || {};

  const rows = weekDays.map((d, i) => {
    const currentVal = existingSched[d] || '';
    const opts = `<option value="">Rest</option>` +
      _b.days.map(day =>
        `<option value="${day.id}"${day.id === currentVal ? ' selected' : ''}>${escHtml(day.name)}</option>`
      ).join('');
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:14px;color:var(--muted);min-width:90px">${weekLabels[i]}</span>
        <select class="form-select sched-select" data-day="${d}"
          style="max-width:200px;padding:8px 32px 8px 12px;font-size:13px;flex:1;margin-left:12px">
          ${opts}
        </select>
      </div>`;
  }).join('');

  container.querySelector('#day-content').innerHTML = `
    <div style="padding:16px 20px">
      <h3 style="font-size:17px;font-weight:700;margin-bottom:4px">
        ${_b.isEdit ? 'Update Schedule' : 'Assign to Schedule'}
      </h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Which day of the week does each workout fall on?</p>
      ${rows}
    </div>`;

  container.querySelector('#measurements-card').style.display = 'none';
  container.querySelector('#save-program-btn').textContent = _b.isEdit ? 'Save Changes' : 'Confirm & Save';
  container.querySelector('#save-program-btn').onclick = () => _confirmSave(container);
}

async function _confirmSave(container) {
  const schedule = {};
  container.querySelectorAll('.sched-select').forEach(sel => {
    schedule[sel.dataset.day] = sel.value || null;
  });

  const program = {
    id: _b.id || DB.generateId(),
    name: _b.name,
    daysPerWeek: _b.days.filter(d => d.exercises.length > 0).length,
    goal: _b.isEdit ? (await DB.getActiveProgram())?.goal || 'custom' : 'custom',
    days: _b.days,
    createdAt: _b.isEdit ? (await DB.getActiveProgram())?.createdAt || new Date().toISOString() : new Date().toISOString(),
    isActive: true,
    isManual: true,
  };

  if (_b.isEdit) {
    // Update in place — don't touch other programs
    await DB.programs.save(program);
    await DB.setActiveProgram(program.id);
    await DB.setSchedule(schedule);
  } else {
    // New program — deactivate all existing first
    const existing = await DB.programs.getAll();
    for (const p of existing) { p.isActive = false; await DB.programs.save(p); }
    await DB.programs.save(program);
    await DB.setActiveProgram(program.id);
    await DB.setSchedule(schedule);
  }

  navigate('program');
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
