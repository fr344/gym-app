// ── Generate Program View ─────────────────────────────────────────────────────

async function renderGenerate(container, params = {}) {
  const hasExisting = !!(await DB.getActiveProgram());

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <h1>New Program</h1>
        <p class="subtitle">Answer a few questions, Claude builds your plan.</p>
      </div>

      ${hasExisting ? `
        <div class="banner banner-info" style="margin:0 16px 16px">
          ⚠ This will replace your current program.
        </div>` : ''}

      <!-- Program Name -->
      <div class="form-group">
        <label class="form-label">Program Name (optional)</label>
        <input class="form-input" id="prog-name" placeholder="e.g. Summer Push Pull Legs" />
      </div>

      <!-- Days per week -->
      <div class="form-group">
        <label class="form-label">Days per week</label>
        <div class="chip-group" id="days-chips">
          ${[3,4,5].map(n => `
            <div class="chip ${n===4 ? 'selected' : ''}" data-val="${n}">${n} days</div>
          `).join('')}
        </div>
      </div>

      <!-- Goal -->
      <div class="form-group">
        <label class="form-label">Primary Goal</label>
        <div class="chip-group" id="goal-chips">
          <div class="chip selected" data-val="hypertrophy">Hypertrophy</div>
          <div class="chip" data-val="strength">Strength</div>
          <div class="chip" data-val="athletic">Athletic</div>
        </div>
      </div>

      <!-- Equipment -->
      <div class="form-group">
        <label class="form-label">Available Equipment</label>
        <div class="chip-group" id="equip-chips">
          <div class="chip selected" data-val="barbell">Barbell</div>
          <div class="chip selected" data-val="dumbbell">Dumbbells</div>
          <div class="chip selected" data-val="cables">Cables</div>
          <div class="chip selected" data-val="machines">Machines</div>
          <div class="chip" data-val="bodyweight">Bodyweight</div>
        </div>
      </div>

      <!-- Schedule picker (shown after generation, but let's do day assignment here) -->
      <div class="form-group">
        <label class="form-label">Schedule your training days</label>
        <div class="chip-group" id="sched-chips">
          ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
            const val = ['mon','tue','wed','thu','fri','sat','sun'][i];
            const defaultOn = ['mon','tue','wed','thu','fri'].includes(val);
            return `<div class="chip ${defaultOn ? 'selected' : ''}" data-val="${val}">${d}</div>`;
          }).join('')}
        </div>
      </div>

      <div class="px-16 mt-16">
        <button class="btn btn-primary" id="generate-btn">
          Generate with Claude
        </button>
      </div>

      <div id="generate-status"></div>
    </div>`;

  // ── Chip toggles ──────────────────────────────────────────────────────────

  // Single-select chips
  ['days-chips', 'goal-chips'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      container.querySelectorAll(`#${id} .chip`).forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    });
  });

  // Multi-select chips
  ['equip-chips', 'sched-chips'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chip.classList.toggle('selected');
    });
  });

  // ── Generate ──────────────────────────────────────────────────────────────
  container.querySelector('#generate-btn').addEventListener('click', async () => {
    const daysPerWeek = parseInt(
      container.querySelector('#days-chips .chip.selected')?.dataset.val || '4'
    );
    const goal = container.querySelector('#goal-chips .chip.selected')?.dataset.val || 'hypertrophy';
    const equipment = [...container.querySelectorAll('#equip-chips .chip.selected')].map(c => c.dataset.val);
    const scheduleDays = [...container.querySelectorAll('#sched-chips .chip.selected')].map(c => c.dataset.val);
    const programName = container.querySelector('#prog-name').value.trim();

    if (!equipment.length) {
      alert('Select at least one equipment type.');
      return;
    }
    if (scheduleDays.length < daysPerWeek) {
      alert(`You need at least ${daysPerWeek} training days selected in the schedule.`);
      return;
    }

    // Show loading
    container.querySelector('#generate-status').innerHTML = `
      <div class="ai-loading">
        <div class="spinner"></div>
        <p>Claude is building your program…<br>This takes about 15 seconds.</p>
      </div>`;
    container.querySelector('#generate-btn').disabled = true;

    try {
      const program = await AI.generateProgram({ daysPerWeek, goal, equipment, programName });

      // Build schedule map: assign program days to selected schedule days
      const schedule = buildSchedule(program.days, scheduleDays);

      // Deactivate old programs
      const existing = await DB.programs.getAll();
      for (const p of existing) {
        p.isActive = false;
        await DB.programs.save(p);
      }

      // Save new program
      await DB.programs.save(program);
      await DB.setActiveProgram(program.id);
      await DB.setSchedule(schedule);

      // Show preview
      _showProgramPreview(container, program, schedule);
    } catch (err) {
      let msg = err.message;
      if (msg === 'NO_API_KEY') msg = 'No API key set. Go to Settings first.';
      container.querySelector('#generate-status').innerHTML = `
        <div class="banner" style="margin:16px;background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.2)">
          ${msg}
        </div>`;
      container.querySelector('#generate-btn').disabled = false;
    }
  });
}

function _showProgramPreview(container, program, schedule) {
  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const schedRows = days.map((d, i) => {
    const dayId = schedule[d];
    const dayInfo = program.days.find(p => p.id === dayId);
    return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="color:var(--muted);font-size:14px">${labels[i]}</span>
      <span style="font-size:14px;font-weight:500">${dayInfo ? dayInfo.name : 'Rest'}</span>
    </div>`;
  }).join('');

  const exerciseSummary = program.days.map(d => `
    <div style="margin-bottom:12px">
      <div style="font-weight:600;font-size:14px;margin-bottom:4px">${d.name}</div>
      <div style="color:var(--muted);font-size:13px">${d.exercises.map(e => e.name).join(' · ')}</div>
    </div>`).join('');

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <h1>${program.name}</h1>
        <p class="subtitle">Your ${program.daysPerWeek}-day program is ready.</p>
      </div>

      <div class="section-label">Weekly Schedule</div>
      <div class="card">${schedRows}</div>

      <div class="section-label">Workout Days</div>
      <div class="card">${exerciseSummary}</div>

      <div class="section-label">4-Week Progression</div>
      <div class="card">
        ${Object.entries(program.progression || {}).map(([w, desc]) => `
          <div style="padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="font-weight:600;font-size:13px;text-transform:capitalize">${w.replace('week', 'Week ')}</div>
            <div style="color:var(--muted);font-size:13px;margin-top:2px">${desc}</div>
          </div>`).join('')}
      </div>

      <div class="px-16 mt-16">
        <button class="btn btn-primary" onclick="navigate('today')">Let's Train</button>
        <button class="btn btn-ghost" onclick="navigate('generate')" style="margin-top:10px">Regenerate</button>
      </div>
    </div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSchedule(programDays, selectedDays) {
  // Distribute program days across selected training days, rest on others
  const schedule = {};
  const allDays = ['mon','tue','wed','thu','fri','sat','sun'];

  allDays.forEach(d => { schedule[d] = null; });

  selectedDays.slice(0, programDays.length).forEach((d, i) => {
    schedule[d] = programDays[i]?.id || null;
  });

  return schedule;
}
