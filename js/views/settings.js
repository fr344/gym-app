// ── Settings View ─────────────────────────────────────────────────────────────

async function renderSettings(container) {
  const apiKey = await DB.getApiKey() || '';
  const program = await DB.getActiveProgram();

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
          type="password"
          placeholder="sk-ant-..."
          value="${apiKey}" />
        <button class="btn btn-secondary mt-8" id="save-key-btn" style="margin-top:10px">Save API Key</button>
      </div>

      <!-- Active program -->
      <div class="section-label">Active Program</div>
      <div class="card">
        ${program
          ? `<div class="settings-row" style="padding:0">
              <span class="settings-row-label">${program.name}</span>
              <span class="settings-row-value">${program.daysPerWeek}d/wk</span>
             </div>
             <button class="btn btn-ghost mt-8" onclick="navigate('generate')" style="margin-top:12px">Generate New Program</button>`
          : `<p style="color:var(--muted);font-size:14px;margin-bottom:12px">No active program.</p>
             <button class="btn btn-primary" onclick="navigate('generate')">Generate Program</button>`
        }
      </div>

      <!-- Danger zone -->
      <div class="section-label">Data</div>
      <div class="card">
        <button class="btn btn-danger" id="clear-logs-btn">Clear Workout History</button>
        <button class="btn btn-danger" id="reset-all-btn" style="margin-top:10px">Reset Everything</button>
      </div>

      <div style="text-align:center;padding:32px 20px;color:var(--muted);font-size:12px">
        Gym Tracker · Built with Claude
      </div>
    </div>`;

  // Save API key
  container.querySelector('#save-key-btn').addEventListener('click', async () => {
    const key = container.querySelector('#api-key-input').value.trim();
    if (!key) { alert('Enter an API key.'); return; }
    await DB.setApiKey(key);
    const btn = container.querySelector('#save-key-btn');
    btn.textContent = 'Saved ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Save API Key'; btn.disabled = false; }, 2000);
  });

  // Clear logs
  container.querySelector('#clear-logs-btn').addEventListener('click', async () => {
    if (!confirm('Delete all workout history? This cannot be undone.')) return;
    const logs = await DB.logs.getAll();
    for (const l of logs) await DB.logs.delete(l.id);
    alert('History cleared.');
    navigate('settings');
  });

  // Reset all
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
}
