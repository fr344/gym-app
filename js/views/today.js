// ── Today View ────────────────────────────────────────────────────────────────

async function renderToday(container) {
  const program = await DB.getActiveProgram();
  const schedule = await DB.getSchedule();
  const today = DB.dayOfWeek();
  const todayStr = DB.todayStr();

  // No program yet
  if (!program) {
    container.innerHTML = `
      <div class="view">
        <div class="page-header">
          <h1>Today</h1>
          <p class="subtitle">${formatDate(new Date())}</p>
        </div>
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <h2>No program yet</h2>
          <p>Generate your first program to start tracking workouts.</p>
        </div>
        <div class="px-16">
          <button class="btn btn-primary" onclick="navigate('generate')">Generate Program</button>
        </div>
      </div>`;
    return;
  }

  // What day is scheduled today?
  const scheduledDayId = schedule?.[today];
  const todayDay = program.days.find(d => d.id === scheduledDayId);

  // Check if already logged today
  const todayLog = (await DB.logs.getAll()).find(l => l.date === todayStr);

  const html = `
    <div class="view">
      <div class="page-header">
        <h1>Today</h1>
        <p class="subtitle">${formatDate(new Date())}</p>
      </div>

      ${renderWeekStrip(schedule, program, today)}

      ${todayDay ? renderTodayWorkout(todayDay, program, todayLog) : renderRestDay()}
    </div>`;

  container.innerHTML = html;

  // Start workout button
  const startBtn = container.querySelector('#start-workout-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      navigate('workout', { day: todayDay, program });
    });
  }
}

function renderWeekStrip(schedule, program, today) {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const pills = days.map((d, i) => {
    const dayId = schedule?.[d];
    const dayInfo = program.days.find(p => p.id === dayId);
    const isToday = d === today;
    const label = dayInfo ? abbrev(dayInfo.name) : '–';
    const cls = isToday ? 'today' : dayInfo ? 'has-workout' : '';

    return `
      <div class="schedule-day">
        <span class="schedule-day-label">${labels[i]}</span>
        <div class="schedule-day-btn ${cls}">${label}</div>
      </div>`;
  }).join('');

  return `<div class="schedule-grid">${pills}</div>`;
}

function renderTodayWorkout(day, program, existingLog) {
  const exerciseList = day.exercises.map(ex => `
    <div class="exercise-row">
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <div class="exercise-meta">${ex.sets} sets · ${ex.reps} reps · ${ex.weight}kg</div>
      </div>
    </div>`).join('');

  const alreadyDone = !!existingLog;

  return `
    <div class="card">
      <div class="card-title">${day.focus || day.name}</div>
      <p style="font-size:22px;font-weight:700;margin-bottom:4px">${day.name}</p>
      <p class="text-muted" style="font-size:13px;margin-bottom:16px">
        ${day.exercises.length} exercises · ~${estimateTime(day.exercises)} min
      </p>
      ${exerciseList}
    </div>

    <div class="px-16 mt-16">
      ${alreadyDone
        ? `<div class="banner banner-success">
            <svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"><polyline points="20 6 9 17 4 12"/></svg>
            Workout logged today
           </div>
           <button class="btn btn-secondary" id="start-workout-btn">Log Again</button>`
        : `<button class="btn btn-primary" id="start-workout-btn">Start Workout</button>`
      }
    </div>`;
}

function renderRestDay() {
  return `
    <div class="card">
      <div class="card-title">Today</div>
      <p style="font-size:22px;font-weight:700;margin-bottom:4px">Rest Day</p>
      <p class="text-muted" style="font-size:14px;margin-top:8px">
        Recovery is part of the program. See you tomorrow.
      </p>
    </div>
    <div class="px-16 mt-16">
      <button class="btn btn-ghost" onclick="navigate('program')">View Full Program</button>
    </div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function abbrev(name) {
  // Shorten day names for the strip
  const map = {
    'push': 'PSH', 'pull': 'PLL', 'legs': 'LEG',
    'upper': 'UPR', 'lower': 'LWR', 'full body': 'FUL',
    'rest': '–',
  };
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return name.slice(0, 3).toUpperCase();
}

function estimateTime(exercises) {
  // ~8 min per exercise (sets + rest)
  return exercises.length * 8;
}
