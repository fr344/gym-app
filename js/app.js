// ── App Shell & Router ────────────────────────────────────────────────────────

const VIEWS = {
  today:    renderToday,
  program:  renderProgram,
  history:  renderHistory,
  settings: renderSettings,
  workout:  renderWorkout,
  generate: renderGenerate,
};

let currentView = null;

async function navigate(view, params = {}) {
  currentView = view;
  window._navParams = params;

  // Update nav highlight (only main tabs)
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  const container = document.getElementById('view-container');
  container.innerHTML = '';

  const renderer = VIEWS[view];
  if (renderer) await renderer(container, params);

  container.scrollTop = 0;
}

// ── Nav ───────────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  // Check if user has an API key set
  const apiKey = await DB.getApiKey();
  const program = await DB.getActiveProgram();

  if (!apiKey) {
    navigate('settings');
    document.querySelector('[data-view="settings"]').classList.add('active');
  } else if (!program) {
    navigate('generate');
    document.querySelector('[data-view="program"]').classList.add('active');
  } else {
    navigate('today');
  }
}

boot();
