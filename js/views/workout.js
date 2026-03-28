// ── Active Workout View ───────────────────────────────────────────────────────
// State lives in module-level vars (reset on each render)

let _workoutState = null;

async function renderWorkout(container, params) {
  const { day, program } = params;

  if (!day) { navigate('today'); return; }

  // Load last session for this day to pre-fill weights
  const lastLog = await DB.logs.getLastForDay(day.id);

  // Build state: one entry per exercise with set tracking
  _workoutState = {
    day,
    program,
    startTime: Date.now(),
    exercises: day.exercises.map(ex => {
      const lastEx = lastLog?.exercises.find(e => e.id === ex.id);
      return {
        ...ex,
        sets: Array.from({ length: ex.sets }, (_, i) => {
          const lastSet = lastEx?.sets[i];
          return {
            weight: lastSet?.weight ?? ex.weight,
            reps: lastSet?.reps ?? parseRepsTarget(ex.reps),
            done: false,
          };
        }),
      };
    }),
  };

  _renderWorkoutUI(container);
}

function _renderWorkoutUI(container) {
  const { day, exercises } = _workoutState;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const doneSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.done).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const exerciseCards = exercises.map((ex, exIdx) => `
    <div class="card" id="ex-card-${exIdx}">
      <div style="margin-bottom:12px">
        <div class="exercise-name" style="font-size:17px;font-weight:600">${ex.name}</div>
        <div class="exercise-meta">${ex.muscleGroup} · ${ex.notes || ''}</div>
      </div>

      <div class="set-header">
        <span>SET</span><span>KG</span><span>REPS</span><span></span>
      </div>

      ${ex.sets.map((set, sIdx) => `
        <div class="set-row" id="set-${exIdx}-${sIdx}">
          <span class="set-num">${sIdx + 1}</span>
          <input class="set-input" type="number" inputmode="decimal"
            value="${set.weight}" placeholder="kg"
            data-ex="${exIdx}" data-set="${sIdx}" data-field="weight"
            ${set.done ? 'disabled' : ''} />
          <input class="set-input" type="number" inputmode="numeric"
            value="${set.reps}" placeholder="reps"
            data-ex="${exIdx}" data-set="${sIdx}" data-field="reps"
            ${set.done ? 'disabled' : ''} />
          <button class="set-check ${set.done ? 'done' : ''}"
            data-ex="${exIdx}" data-set="${sIdx}" aria-label="Complete set">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      `).join('')}
    </div>
  `).join('');

  container.innerHTML = `
    <div class="view">
      <div class="workout-header">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2>${day.name}</h2>
            <div class="workout-meta">${doneSets}/${totalSets} sets · ${pct}%</div>
          </div>
          <button class="btn btn-sm btn-ghost" id="finish-btn">Finish</button>
        </div>
        <div class="progress-bar mt-8">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>

      ${exerciseCards}

      <div class="px-16 mt-16">
        <button class="btn btn-primary" id="finish-btn-bottom">Finish Workout</button>
        <button class="btn btn-ghost mt-8" onclick="navigate('today')" style="margin-top:10px">Cancel</button>
      </div>
    </div>`;

  _attachWorkoutListeners(container);
}

function _attachWorkoutListeners(container) {
  // Input changes → update state
  container.querySelectorAll('.set-input').forEach(input => {
    input.addEventListener('change', e => {
      const { ex, set, field } = e.target.dataset;
      const val = parseFloat(e.target.value) || 0;
      _workoutState.exercises[ex].sets[set][field] = val;
    });
  });

  // Set check buttons
  container.querySelectorAll('.set-check').forEach(btn => {
    btn.addEventListener('click', e => {
      const { ex, set } = btn.dataset;
      const exIdx = parseInt(ex);
      const sIdx = parseInt(set);
      const setObj = _workoutState.exercises[exIdx].sets[sIdx];

      // Read current input values before locking
      const row = container.querySelector(`#set-${exIdx}-${sIdx}`);
      const weightInput = row.querySelector('[data-field="weight"]');
      const repsInput = row.querySelector('[data-field="reps"]');
      setObj.weight = parseFloat(weightInput.value) || setObj.weight;
      setObj.reps = parseInt(repsInput.value) || setObj.reps;
      setObj.done = !setObj.done;

      // Update UI without full re-render
      btn.classList.toggle('done', setObj.done);
      weightInput.disabled = setObj.done;
      repsInput.disabled = setObj.done;

      // Update header progress
      _updateProgress(container);
    });
  });

  // Finish buttons
  container.querySelector('#finish-btn')?.addEventListener('click', () => _finishWorkout(container));
  container.querySelector('#finish-btn-bottom')?.addEventListener('click', () => _finishWorkout(container));
}

function _updateProgress(container) {
  const { exercises } = _workoutState;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const doneSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.done).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const meta = container.querySelector('.workout-meta');
  if (meta) meta.textContent = `${doneSets}/${totalSets} sets · ${pct}%`;

  const fill = container.querySelector('.progress-fill');
  if (fill) fill.style.width = pct + '%';
}

async function _finishWorkout(container) {
  const { day, program, exercises, startTime } = _workoutState;
  const durationMin = Math.round((Date.now() - startTime) / 60000);

  // Build log entry
  const log = {
    id: DB.generateId(),
    date: DB.todayStr(),
    programId: program.id,
    programDayId: day.id,
    dayName: day.name,
    durationMin,
    exercises: exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, done: s.done })),
    })),
  };

  await DB.logs.save(log);

  // ── Detect weight changes and update program ──────────────────────────────
  const weightUpdates = [];
  const updatedProgram = JSON.parse(JSON.stringify(program));
  const programDay = updatedProgram.days.find(d => d.id === day.id);

  if (programDay) {
    exercises.forEach(ex => {
      const doneSets = ex.sets.filter(s => s.done);
      if (!doneSets.length) return;

      // Use the weight from the last done set (most recent adjustment)
      const lastWeight = doneSets[doneSets.length - 1].weight;
      const programEx = programDay.exercises.find(e => e.id === ex.id);

      if (programEx && lastWeight !== programEx.weight) {
        weightUpdates.push({ name: ex.name, old: programEx.weight, new: lastWeight });
        programEx.weight = lastWeight;
      }
    });

    if (weightUpdates.length) {
      await DB.programs.save(updatedProgram);
    }
  }

  const totalDone = exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0);

  const updatesHtml = weightUpdates.length ? `
    <div style="width:100%;background:var(--surface);border-radius:12px;padding:14px 16px;margin-top:24px;text-align:left">
      <div style="font-size:12px;font-weight:600;color:var(--green);letter-spacing:.05em;margin-bottom:8px">WEIGHTS UPDATED FOR NEXT SESSION</div>
      ${weightUpdates.map(u => `
        <div style="font-size:13px;color:var(--muted);padding:4px 0;display:flex;justify-content:space-between">
          <span>${u.name}</span>
          <span style="color:var(--text)">${u.old}kg → ${u.new}kg</span>
        </div>`).join('')}
    </div>` : '';

  // Show completion screen
  container.innerHTML = `
    <div class="view">
      <div class="complete-screen">
        <div class="big-check">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Workout Done</h2>
        <p>${day.name} · ${durationMin} min</p>
        <p class="text-muted" style="font-size:13px;margin-top:4px">
          ${totalDone} sets completed
        </p>
        ${updatesHtml}
        <div style="width:100%;margin-top:32px">
          <button class="btn btn-primary" onclick="navigate('today')">Back to Today</button>
          <button class="btn btn-ghost mt-8" onclick="navigate('history')" style="margin-top:10px">View History</button>
        </div>
      </div>
    </div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseRepsTarget(reps) {
  // "6-8" → 7, "10" → 10, "AMRAP" → 10
  if (!reps) return 10;
  const match = String(reps).match(/(\d+)-(\d+)/);
  if (match) return Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2);
  const num = parseInt(reps);
  return isNaN(num) ? 10 : num;
}
