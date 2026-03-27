// ── History View ──────────────────────────────────────────────────────────────

async function renderHistory(container) {
  const logs = await DB.logs.getAll();
  logs.sort((a, b) => b.date.localeCompare(a.date));

  if (!logs.length) {
    container.innerHTML = `
      <div class="view">
        <div class="page-header">
          <h1>History</h1>
        </div>
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <h2>No workouts yet</h2>
          <p>Your logged sessions will appear here.</p>
        </div>
      </div>`;
    return;
  }

  // Group by month
  const groups = {};
  logs.forEach(log => {
    const month = log.date.slice(0, 7); // "2025-03"
    if (!groups[month]) groups[month] = [];
    groups[month].push(log);
  });

  const groupHtml = Object.entries(groups).map(([month, monthLogs]) => {
    const label = new Date(month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const rows = monthLogs.map(log => renderHistoryRow(log)).join('');
    return `<div class="section-label">${label}</div>${rows}`;
  }).join('');

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <h1>History</h1>
        <p class="subtitle">${logs.length} session${logs.length !== 1 ? 's' : ''} logged</p>
      </div>
      ${groupHtml}
    </div>`;

  // Tap to expand
  container.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const detail = item.nextElementSibling;
      if (detail?.classList.contains('history-detail')) {
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
      }
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
