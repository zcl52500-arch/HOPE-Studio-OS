const themes = {
  aurora: {
    label: 'Aurora',
    background: 'radial-gradient(circle at 12% 18%, #7dd3fc 0 16%, transparent 28%), radial-gradient(circle at 86% 12%, #c084fc 0 18%, transparent 32%), linear-gradient(135deg, #111827 0%, #312e81 48%, #0f172a 100%)',
    accent: '#a7f3d0',
    text: '#f8fafc',
    muted: '#cbd5e1',
  },
  sunrise: {
    label: 'Sunrise',
    background: 'radial-gradient(circle at 80% 20%, #fde68a 0 18%, transparent 32%), linear-gradient(135deg, #fb7185 0%, #f97316 48%, #7c2d12 100%)',
    accent: '#fff7ed',
    text: '#fff7ed',
    muted: '#ffedd5',
  },
  graphite: {
    label: 'Graphite',
    background: 'linear-gradient(135deg, #020617 0%, #1e293b 55%, #0f172a 100%)',
    accent: '#38bdf8',
    text: '#f8fafc',
    muted: '#94a3b8',
  },
};

const poster = {
  eyebrow: 'HOPE Studio Presents',
  title: 'Poster Renderer',
  subtitle: 'Compose polished posters directly in the browser.',
  details: 'July 16 · Main Stage · 8 PM',
  cta: 'Reserve your seat',
  theme: 'aurora',
  density: 62,
};

const preview = document.querySelector('#posterPreview');
const fields = document.querySelectorAll('[data-poster-field]');
const controls = document.querySelectorAll('[data-control]');
const themeGrid = document.querySelector('#themeGrid');
const exportButton = document.querySelector('#exportButton');

function renderThemeButtons() {
  themeGrid.innerHTML = Object.entries(themes)
    .map(([key, theme]) => `<button type="button" data-theme="${key}">${theme.label}</button>`)
    .join('');
}

function applyTheme() {
  const selectedTheme = themes[poster.theme];
  preview.style.setProperty('--poster-bg', selectedTheme.background);
  preview.style.setProperty('--poster-accent', selectedTheme.accent);
  preview.style.setProperty('--poster-text', selectedTheme.text);
  preview.style.setProperty('--poster-muted', selectedTheme.muted);
  preview.style.setProperty('--poster-density', `${poster.density}%`);

  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.theme === poster.theme);
  });
}

function renderPoster() {
  fields.forEach((field) => {
    field.textContent = poster[field.dataset.posterField];
  });
  controls.forEach((control) => {
    control.value = poster[control.dataset.control];
  });
  applyTheme();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'poster';
}

function exportPoster() {
  const printable = window.open('', 'poster-print');
  const styles = [...document.styleSheets]
    .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('\n'))
    .join('\n');

  printable.document.write(`<!doctype html><title>${poster.title}</title><style>${styles}</style>${preview.outerHTML}`);
  printable.document.close();
  printable.document.body.className = 'export-page';
  printable.document.querySelector('#posterPreview')?.setAttribute('aria-label', `${poster.title} poster`);
  printable.focus();
  printable.print();
}

renderThemeButtons();
renderPoster();

controls.forEach((control) => {
  control.addEventListener('input', (event) => {
    const key = event.target.dataset.control;
    poster[key] = key === 'density' ? Number(event.target.value) : event.target.value;
    renderPoster();
  });
});

themeGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-theme]');
  if (!button) return;
  poster.theme = button.dataset.theme;
  renderPoster();
});

exportButton.addEventListener('click', exportPoster);

window.posterRenderer = { poster, themes, exportPoster, slugify };
