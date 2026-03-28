// ── History View ──────────────────────────────────────────────────────────────

async function renderHistory(container) {
  const logs = await DB.logs.getAll();
  logs.sort((a, b) => b.date.localeCompare(a.date));

  const bodyEntries = await DB.bodyLogs.getAll(); // sorted desc by date

  // Group workout logs by month
  const groups = {};
  logs.forEach(log => {
    const month = log.date.slice(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(log);
  });

  const groupHtml = Object.entries(groups).map(([month, monthLogs]) => {
    const label = new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const rows = monthLogs.map(log => renderHistoryRow(log)).join('');
    return `<div class="section-label">${label}</div>${rows}`;
  }).join('');

  const emptyWorkouts = !logs.length ? `
    <div class="empty-state" style="margin-top:0;padding-top:24px">
      <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <h2>No workouts yet</h2>
      <p>Your logged sessions will appear here.</p>
    </div>` : groupHtml;

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <div>
          <h1>History</h1>
          ${logs.length ? `<p class="subtitle">${logs.length} session${logs.length !== 1 ? 's' : ''} logged</p>` : ''}
        </div>
        <button id="body-stats-btn" aria-label="Body stats"
          style="background:none;border:none;cursor:pointer;padding:4px;color:var(--muted)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>

      ${emptyWorkouts}
    </div>

    <!-- Body stats slide-up panel -->
    <div id="body-stats-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200"></div>
    <div id="body-stats-panel" style="display:none;position:fixed;bottom:0;left:0;right:0;
      background:var(--surface);border-radius:20px 20px 0 0;z-index:201;
      max-height:80vh;overflow-y:auto;padding:0 0 40px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 20px 16px">
        <h2 style="font-size:18px;font-weight:700;margin:0">Body Weight</h2>
        <button id="close-stats-btn" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:4px">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin:round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Log entry form -->
      <div style="padding:0 20px 20px;border-bottom:1px solid var(--border)">
        <div style="display:flex;gap:10px;align-items:flex-end">
          <div style="flex:1">
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px">WEIGHT (KG)</div>
            <input id="body-weight-input" type="number" inputmode="decimal" step="0.1"
              placeholder="e.g. 82.5"
              style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;
                padding:12px 14px;color:var(--text);font-size:16px;box-sizing:border-box" />
          </div>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px">DATE</div>
            <input id="body-date-input" type="date" value="${DB.todayStr()}"
              style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;
                padding:12px 14px;color:var(--text);font-size:16px;box-sizing:border-box" />
          </div>
          <button id="save-body-btn" class="btn btn-primary"
            style="padding:12px 20px;flex-shrink:0;margin-bottom:0">Log</button>
        </div>
      </div>

      <!-- Chart + entries rendered by JS -->
      <div id="body-chart-area" style="padding:20px 20px 0"></div>
    </div>`;

  // Tap to expand workout rows
  container.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const detail = item.nextElementSibling;
      if (detail?.classList.contains('history-detail')) {
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
      }
    });
  });

  // ── Body stats panel logic ────────────────────────────────────────────────
  const overlay = document.getElementById('body-stats-overlay');
  const panel   = document.getElementById('body-stats-panel');
  const closeBtn = document.getElementById('close-stats-btn');

  function openPanel() {
    overlay.style.display = 'block';
    panel.style.display = 'block';
    _renderBodyChart(bodyEntries);
  }
  function closePanel() {
    overlay.style.display = 'none';
    panel.style.display = 'none';
  }

  container.querySelector('#body-stats-btn').addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  // Save new entry
  document.getElementById('save-body-btn').addEventListener('click', async () => {
    const w = parseFloat(document.getElementById('body-weight-input').value);
    const d = document.getElementById('body-date-input').value;
    if (!w || !d) { alert('Enter a weight and date.'); return; }

    const entry = { id: DB.generateId(), date: d, weight: w };
    await DB.bodyLogs.save(entry);

    // Refresh entries and re-render chart
    const updated = await DB.bodyLogs.getAll();
    bodyEntries.length = 0;
    updated.forEach(e => bodyEntries.push(e));
    _renderBodyChart(bodyEntries);

    document.getElementById('body-weight-input').value = '';
  });

  // Open panel immediately if hash says so (deep-link from other views)
  if (window._navParams?.openBodyStats) openPanel();
}

// ── Body weight chart ─────────────────────────────────────────────────────────
function _renderBodyChart(entries) {
  const area = document.getElementById('body-chart-area');
  if (!area) return;

  if (!entries.length) {
    area.innerHTML = `<p style="color:var(--muted);font-size:14px;text-align:center;padding:16px 0">
      No entries yet. Log your first weigh-in above.</p>`;
    return;
  }

  // Sort ascending for chart (entries is already desc from DB)
  const asc = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const weights = asc.map(e => e.weight);
  const minW = Math.floor(Math.min(...weights)) - 1;
  const maxW = Math.ceil(Math.max(...weights)) + 1;
  const range = maxW - minW || 1;

  const W = 320, H = 140, PAD = { t: 12, r: 16, b: 28, l: 36 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const toX = i => PAD.l + (i / Math.max(asc.length - 1, 1)) * chartW;
  const toY = w => PAD.t + (1 - (w - minW) / range) * chartH;

  // Y axis labels
  const yTicks = [minW, Math.round((minW + maxW) / 2), maxW];
  const yLines = yTicks.map(v =>
    `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${toY(v)}" y2="${toY(v)}"
      stroke="var(--border)" stroke-width="1"/>
     <text x="${PAD.l - 6}" y="${toY(v) + 4}" text-anchor="end"
      font-size="10" fill="var(--muted)">${v}</text>`
  ).join('');

  // X axis labels (first and last date only)
  const fmt = d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-GB', { day:'numeric', month:'short' }); };
  const xLabels = asc.length >= 2 ? `
    <text x="${toX(0)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${fmt(asc[0].date)}</text>
    <text x="${toX(asc.length - 1)}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--muted)">${fmt(asc[asc.length - 1].date)}</text>
  ` : '';

  // Polyline
  const pts = asc.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ');

  // Fill area under line
  const fillPts = `${toX(0)},${toY(minW)} ` + asc.map((e, i) => `${toX(i)},${toY(e.weight)}`).join(' ') + ` ${toX(asc.length - 1)},${toY(minW)}`;

  // Dots
  const dots = asc.map((e, i) =>
    `<circle cx="${toX(i)}" cy="${toY(e.weight)}" r="3" fill="var(--green)"/>`
  ).join('');

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;overflow:visible">
      ${yLines}
      <polygon points="${fillPts}" fill="var(--green)" opacity=".08"/>
      <polyline points="${pts}" fill="none" stroke="var(--green)" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      ${xLabels}
    </svg>`;

  // Recent entries list (most recent first, max 8)
  const listHtml = entries.slice(0, 8).map(e => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:10px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:14px;font-weight:500">${e.weight} kg</div>
        <div style="font-size:12px;color:var(--muted)">${new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}</div>
      </div>
      <button data-id="${e.id}" class="body-delete-btn"
        style="background:none;border:none;cursor:pointer;color:var(--muted);padding:6px">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`).join('');

  const latestEntry = entries[0];
  const summary = latestEntry
    ? `<div style="font-size:13px;color:var(--muted);margin-bottom:16px">
         Latest: <strong style="color:var(--text)">${latestEntry.weight} kg</strong>
         on ${new Date(latestEntry.date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
       </div>`
    : '';

  area.innerHTML = `
    ${summary}
    <div style="margin-bottom:16px">${svg}</div>
    <div style="font-size:12px;color:var(--muted);font-weight:600;letter-spacing:.05em;margin-bottom:4px">RECENT ENTRIES</div>
    <div id="body-entries-list">${listHtml}</div>`;

  // Delete handlers
  area.querySelectorAll('.body-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await DB.bodyLogs.delete(btn.dataset.id);
      const updated = await DB.bodyLogs.getAll();
      entries.length = 0;
      updated.forEach(e => entries.push(e));
      _renderBodyChart(entries);
    });
  });
}

function renderHistoryRow(log) {
  const d = new Date(log.date + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const totalSets = log.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0);
  const totalVol = log.exercises.reduce((s, ex) =>
    s + ex.sets.filter(x => x.done).reduce((ss, set) => ss + (set.weight * set.reps), 0), 0
  );

  const detail = log.exercises.map(ex => {
    const doneSets = ex.sets.filter(s => s.done);
    if (!doneSets.length) return '';
    return `
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:14px;font-weight:500;margin-bottom:4px">${ex.name}</div>
        <div style="color:var(--muted);font-size:13px">${doneSets.map(s => `${s.weight}kg × ${s.reps}`).join(' · ')}</div>
      </div>`;
  }).join('');

  return `
    <div class="history-item">
      <div class="history-date-block">
        <div class="history-date-day">${day}</div>
        <div class="history-date-month">${month}</div>
      </div>
      <div class="history-info">
        <div class="history-title">${log.dayName}</div>
        <div class="history-meta">${totalSets} sets · ${Math.round(totalVol / 1000 * 10) / 10}t volume${log.durationMin ? ` · ${log.durationMin}min` : ''}</div>
      </div>
      <svg viewBox="0 0 24 24" width="16" height="16" style="stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
    <div class="history-detail" style="display:none;padding:0 20px 8px;background:var(--surface);border-bottom:1px solid var(--border)">
      ${detail}
    </div>`;
}
