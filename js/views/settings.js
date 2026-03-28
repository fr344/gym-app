// ── Settings View ─────────────────────────────────────────────────────────────

async function renderSettings(container) {
  const apiKey = await DB.getApiKey() || '';
  const program = await DB.getActiveProgram();
  const devMode = DB.dev.isEnabled();
  const simDay = DB.dev.getDay();
  const mockAI = DB.dev.isMockAI();

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <h1>Settings</h1>
      </div>

      <!-- API Key -->
      <div class="section-label">Claude API Key</div>
      <div class="card">
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.6">
          Required to generate workout programs. Get your key at
          <span style="color:var(--text)">console.anthropic.com</span>
        </p>
        <input class="form-input api-key-input" id="api-key-input"
          type="password" placeholder="sk-ant-..." value="${apiKey}" />
        <button class="btn btn-secondary" id="save-key-btn" style="margin-top:10px">Save API Key</button>
      </div>

      <!-- Active program -->
      <div class="section-label">Active Program</div>
      <div class="card">
        ${program
          ? `<div class="settings-row" style="padding:0">
              <span class="settings-row-label">${program.name}</span>
              <span class="settings-row-value">${program.daysPerWeek}d/wk</span>
             </div>
             <button class="btn btn-ghost" onclick="navigate('generate')" style="margin-top:12px">Generate New Program</button>`
          : `<p style="color:var(--muted);font-size:14px;margin-bottom:12px">No active program.</p>
             <button class="btn btn-primary" onclick="navigate('generate')">Generate Program</button>`
        }
      </div>

      <!-- Data -->
      <div class="section-label">Data</div>
      <div class="card">
        <button class="btn btn-danger" id="clear-logs-btn">Clear Workout History</button>
        <button class="btn btn-danger" id="reset-all-btn" style="margin-top:10px">Reset Everything</button>
      </div>

      <!-- Developer Mode toggle -->
      <div class="section-label">Developer</div>
      <div class="card">
        <div class="settings-row" style="padding:0 0 14px;border-bottom:1px solid var(--border)">
          <div>
            <div class="settings-row-label">Developer Mode</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">Enables testing tools below</div>
          </div>
          <label style="position:relative;display:inline-block;width:44px;height:26px;flex-shrink:0">
            <input type="checkbox" id="dev-mode-toggle" ${devMode ? 'checked' : ''}
              style="opacity:0;width:0;height:0;position:absolute" />
            <span id="dev-mode-track" style="position:absolute;inset:0;border-radius:13px;cursor:pointer;
              background:${devMode ? 'var(--green)' : 'var(--border)'};transition:background .2s">
              <span style="position:absolute;width:20px;height:20px;border-radius:50%;background:#fff;
                top:3px;left:${devMode ? '21px' : '3px'};transition:left .2s" id="dev-mode-thumb"></span>
            </span>
          </label>
        </div>

        <!-- Dev tools — only visible when dev mode on -->
        <div id="dev-tools" style="display:${devMode ? 'block' : 'none'}">

          <!-- Day simulator -->
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600;margin-bottom:8px">Simulate Day of Week</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
              Overrides what day the app thinks today is. Affects Today view and workout logging.
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap" id="day-sim-chips">
              ${['mon','tue','wed','thu','fri','sat','sun'].map(d => `
                <div class="chip ${simDay === d ? 'selected' : ''}" data-day="${d}"
                  style="font-size:13px;padding:6px 12px">
                  ${d.charAt(0).toUpperCase() + d.slice(1)}
                </div>`).join('')}
              <div class="chip ${!simDay ? 'selected' : ''}" data-day=""
                style="font-size:13px;padding:6px 12px">Real day</div>
            </div>
          </div>

          <!-- AI Mock Mode -->
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <div style="font-size:13px;font-weight:600">AI Mock Mode</div>
                <div style="font-size:12px;color:var(--muted);margin-top:2px">
                  Generates a fake program instantly — no API call, no credits used
                </div>
              </div>
              <label style="position:relative;display:inline-block;width:44px;height:26px;flex-shrink:0;margin-left:12px">
                <input type="checkbox" id="mock-ai-toggle" ${mockAI ? 'checked' : ''}
                  style="opacity:0;width:0;height:0;position:absolute" />
                <span id="mock-ai-track" style="position:absolute;inset:0;border-radius:13px;cursor:pointer;
                  background:${mockAI ? 'var(--green)' : 'var(--border)'};transition:background .2s">
                  <span style="position:absolute;width:20px;height:20px;border-radius:50%;background:#fff;
                    top:3px;left:${mockAI ? '21px' : '3px'};transition:left .2s" id="mock-ai-thumb"></span>
                </span>
              </label>
            </div>
          </div>

          <!-- Seed history -->
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">Seed 2 Weeks of History</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
              Injects fake workout logs for the past 14 days to test the History view
            </div>
            <button class="btn btn-secondary btn-sm" id="seed-history-btn" style="width:auto">Seed History</button>
          </div>

          <!-- Clear today's log -->
          <div style="padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">Clear Today's Log</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
              Removes today's session so you can re-run the Start Workout flow
            </div>
            <button class="btn btn-secondary btn-sm" id="clear-today-btn" style="width:auto">Clear Today</button>
          </div>

          <!-- DB state -->
          <div style="padding:14px 0">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">Inspect DB State</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:10px">
              Dumps a summary of everything stored in IndexedDB
            </div>
            <button class="btn btn-secondary btn-sm" id="show-db-btn" style="width:auto">Show DB</button>
            <pre id="db-output" style="display:none;margin-top:12px;font-size:11px;color:var(--muted);
              background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;
              overflow-x:auto;white-space:pre-wrap;line-height:1.5"></pre>
          </div>

        </div>
      </div>

      <div style="text-align:center;padding:32px 20px;color:var(--muted);font-size:12px">
        Gym Tracker · Built with Claude
      </div>
    </div>`;

  // ── Save API key ──────────────────────────────────────────────────────────
  container.querySelector('#save-key-btn').addEventListener('click', async () => {
    const key = container.querySelector('#api-key-input').value.trim();
    if (!key) { alert('Enter an API key.'); return; }
    await DB.setApiKey(key);
    const btn = container.querySelector('#save-key-btn');
    btn.textContent = 'Saved ✓'; btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Save API Key'; btn.disabled = false; }, 2000);
  });

  // ── Clear logs ────────────────────────────────────────────────────────────
  container.querySelector('#clear-logs-btn').addEventListener('click', async () => {
    if (!confirm('Delete all workout history? This cannot be undone.')) return;
    const logs = await DB.logs.getAll();
    for (const l of logs) await DB.logs.delete(l.id);
    alert('History cleared.');
    navigate('settings');
  });

  // ── Reset all ─────────────────────────────────────────────────────────────
  container.querySelector('#reset-all-btn').addEventListener('click', async () => {
    if (!confirm('Reset everything? This deletes your program, history, and settings.')) return;
    const programs = await DB.programs.getAll();
    for (const p of programs) await DB.programs.delete(p.id);
    const logs = await DB.logs.getAll();
    for (const l of logs) await DB.logs.delete(l.id);
    await DB.settings.set('activeProgramId', null);
    await DB.settings.set('schedule', null);
    alert('Reset complete.');
    navigate('settings');
  });

  // ── Dev mode toggle ───────────────────────────────────────────────────────
  container.querySelector('#dev-mode-toggle').addEventListener('change', e => {
    const on = e.target.checked;
    DB.dev.setMode(on);
    container.querySelector('#dev-tools').style.display = on ? 'block' : 'none';
    container.querySelector('#dev-mode-track').style.background = on ? 'var(--green)' : 'var(--border)';
    container.querySelector('#dev-mode-thumb').style.left = on ? '21px' : '3px';
  });

  // ── Day simulator chips ───────────────────────────────────────────────────
  container.querySelector('#day-sim-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    container.querySelectorAll('#day-sim-chips .chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    DB.dev.setDay(chip.dataset.day);
  });

  // ── AI mock mode toggle ───────────────────────────────────────────────────
  container.querySelector('#mock-ai-toggle').addEventListener('change', e => {
    const on = e.target.checked;
    DB.dev.setMockAI(on);
    container.querySelector('#mock-ai-track').style.background = on ? 'var(--green)' : 'var(--border)';
    container.querySelector('#mock-ai-thumb').style.left = on ? '21px' : '3px';
  });

  // ── Seed history ──────────────────────────────────────────────────────────
  container.querySelector('#seed-history-btn').addEventListener('click', async () => {
    const program = await DB.getActiveProgram();
    if (!program || !program.days.length) {
      alert('Load a program first — seeding uses its days.');
      return;
    }
    const schedule = await DB.getSchedule() || {};
    const dayIds = program.days.map(d => d.id);

    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const weekDay = ['sun','mon','tue','wed','thu','fri','sat'][d.getDay()];
      const programDayId = schedule[weekDay];
      if (!programDayId) continue; // rest day

      const day = program.days.find(x => x.id === programDayId);
      if (!day) continue;

      const log = {
        id: DB.generateId(),
        date: dateStr,
        programId: program.id,
        programDayId,
        dayName: day.name,
        durationMin: 45 + Math.floor(Math.random() * 20),
        exercises: day.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: Array.from({ length: ex.sets }, () => ({
            weight: ex.weight + (Math.random() > 0.5 ? 2.5 : 0),
            reps: parseRepsTarget(ex.reps) + Math.floor(Math.random() * 3),
            done: true,
          })),
        })),
      };
      await DB.logs.save(log);
    }
    alert('2 weeks of history seeded.');
    navigate('history');
  });

  // ── Clear today's log ─────────────────────────────────────────────────────
  container.querySelector('#clear-today-btn').addEventListener('click', async () => {
    const todayStr = DB.todayStr();
    const logs = await DB.logs.getAll();
    const todayLogs = logs.filter(l => l.date === todayStr);
    if (!todayLogs.length) { alert('No log for today.'); return; }
    for (const l of todayLogs) await DB.logs.delete(l.id);
    alert(`Cleared ${todayLogs.length} log(s) for today.`);
  });

  // ── Show DB state ─────────────────────────────────────────────────────────
  container.querySelector('#show-db-btn').addEventListener('click', async () => {
    const pre = container.querySelector('#db-output');
    if (pre.style.display !== 'none') { pre.style.display = 'none'; return; }

    const programs = await DB.programs.getAll();
    const logs = await DB.logs.getAll();
    const settings = await DB.settings.getAll();

    const summary = {
      programs: programs.map(p => ({
        id: p.id, name: p.name, isActive: p.isActive, days: p.days?.length,
      })),
      logs: {
        total: logs.length,
        latest: logs.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3).map(l => ({
          date: l.date, day: l.dayName, sets: l.exercises?.reduce((s,e) => s + e.sets.length, 0),
        })),
      },
      settings: {
        activeProgramId: settings.activeProgramId,
        hasApiKey: !!settings.apiKey,
        schedule: settings.schedule,
        devDay: DB.dev.getDay() || '(real)',
        mockAI: DB.dev.isMockAI(),
      },
    };

    pre.textContent = JSON.stringify(summary, null, 2);
    pre.style.display = 'block';
  });
}
