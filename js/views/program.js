// ── Program View ──────────────────────────────────────────────────────────────

async function renderProgram(container) {
  const program = await DB.getActiveProgram();
  const schedule = await DB.getSchedule();

  if (!program) {
    container.innerHTML = `
      <div class="view">
        <div class="page-header">
          <h1>Program</h1>
        </div>
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <h2>No active program</h2>
          <p>Generate a program to see it here.</p>
        </div>
        <div class="px-16" style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary" onclick="navigate('builder')">Build Manually</button>
          <button class="btn btn-secondary" onclick="navigate('generate')">Generate with Claude</button>
        </div>
      </div>`;
    return;
  }

  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = DB.dayOfWeek();

  const scheduleRows = days.map((d, i) => {
    const dayId = schedule?.[d];
    const dayInfo = program.days.find(p => p.id === dayId);
    const isToday = d === today;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:14px;color:${isToday ? 'var(--accent)' : 'var(--muted)'};font-weight:${isToday ? '700' : '400'}">${labels[i]}${isToday ? ' ·  Today' : ''}</span>
        <span style="font-size:14px;font-weight:500;color:${dayInfo ? 'var(--text)' : 'var(--muted)'}">${dayInfo ? dayInfo.name : 'Rest'}</span>
      </div>`;
  }).join('');

  const dayCards = program.days.map((day, idx) => `
    <div class="program-day-card">
      <div class="program-day-header" data-idx="${idx}">
        <div>
          <h3>${day.name}</h3>
          <div class="day-tag">${day.focus || ''} · ${day.exercises.length} exercises</div>
        </div>
        <svg class="chevron" viewBox="0 0 24 24" width="18" height="18"
          style="stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform 0.2s">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="program-day-body" id="day-body-${idx}">
        ${day.exercises.map(ex => `
          <div class="exercise-row">
            <div class="exercise-info">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-meta">${ex.sets} sets · ${ex.reps} reps · ${ex.weight}kg</div>
              ${ex.notes ? `<div class="exercise-meta" style="margin-top:2px;font-style:italic">${ex.notes}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  const created = new Date(program.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  container.innerHTML = `
    <div class="view">
      <div class="page-header">
        <h1>${program.name}</h1>
        <p class="subtitle">Created ${created} · ${program.daysPerWeek} days/week</p>
      </div>

      <div class="section-label">Weekly Schedule</div>
      <div class="card">${scheduleRows}</div>

      ${program.progression ? `
        <div class="section-label">4-Week Plan</div>
        <div class="card">
          ${Object.entries(program.progression).map(([w, desc]) => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border)">
              <div style="font-weight:600;font-size:13px;text-transform:capitalize">${w.replace('week', 'Week ')}</div>
              <div style="color:var(--muted);font-size:13px;margin-top:2px">${desc}</div>
            </div>`).join('')}
        </div>` : ''}

      <div class="section-label">Workout Days</div>
      ${dayCards}

      <div class="px-16 mt-16" style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary" onclick="navigate('builder')">Build Manually</button>
        <button class="btn btn-ghost" onclick="navigate('generate')">Generate with Claude</button>
      </div>
    </div>`;

  // Accordion
  container.querySelectorAll('.program-day-header').forEach(header => {
    header.addEventListener('click', () => {
      const idx = header.dataset.idx;
      const body = container.querySelector(`#day-body-${idx}`);
      const chevron = header.querySelector('.chevron');
      const isOpen = body.classList.toggle('open');
      chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
    });
  });
}
