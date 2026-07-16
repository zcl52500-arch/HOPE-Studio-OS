const textBindings = [
  { inputId: 'titleInput', previewId: 'titlePreview' },
  { inputId: 'subtitleInput', previewId: 'subtitlePreview' },
  { inputId: 'bodyInput', previewId: 'bodyPreview' },
  { inputId: 'eventInput', previewId: 'eventPreview' },
];

const imageBindings = [
  { inputId: 'qrInput', previewId: 'qrPreview' },
  { inputId: 'logoInput', previewId: 'logoPreview' },
];

const fallbackLayouts = {
  poster: { name: 'Poster', width: '1080px', height: '1440px' },
  wechatOfficialAccount: { name: '公众号', width: '900px', height: '383px' },
  ppt: { name: 'PPT', width: '1920px', height: '1080px' },
  banner: { name: 'Banner', width: '1920px', height: '640px' },
  card: { name: 'Card', width: '360px', height: '240px' },
};

const densityProfiles = {
  compact: { label: 'Compact', padding: 0.7, gap: 0.72, type: 0.86 },
  balanced: { label: 'Balanced', padding: 1, gap: 1, type: 1 },
  spacious: { label: 'Spacious', padding: 1.24, gap: 1.2, type: 1.08 },
};

function syncTextPreview(input, preview) {
  const value = input.value.trim();
  preview.textContent = value;
  preview.classList.toggle('is-empty', value.length === 0);
}

function clearImagePreview(preview) {
  preview.replaceChildren();
  preview.classList.add('is-empty');
}

function syncImagePreview(input, preview) {
  const [file] = input.files;

  if (!file) {
    clearImagePreview(preview);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const image = document.createElement('img');
    image.src = reader.result;
    image.alt = input.name === 'logo' ? 'Uploaded logo' : 'Uploaded QR code';
    preview.replaceChildren(image);
    preview.classList.remove('is-empty');
  });
  reader.readAsDataURL(file);
}

function parsePixelValue(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getLayoutOrientation(width, height) {
  if (Math.abs(width - height) < 80) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

function buildLayoutOptions(layouts) {
  return Object.entries(layouts).map(([id, layout]) => {
    const width = parsePixelValue(layout.width, 1080);
    const height = parsePixelValue(layout.height, 1440);

    return {
      id,
      name: layout.name || id,
      width,
      height,
      orientation: getLayoutOrientation(width, height),
    };
  });
}

function populateLayoutSelect(select, layouts) {
  select.replaceChildren();

  layouts.forEach((layout) => {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = `${layout.name} · ${layout.width} × ${layout.height}`;
    select.append(option);
  });
}

function applyLayout({ canvas, layout, density, namePreview, sizePreview }) {
  const scale = Math.min(1, 680 / layout.width, 760 / layout.height);
  const previewWidth = Math.round(layout.width * scale);
  const previewHeight = Math.round(layout.height * scale);
  const profile = densityProfiles[density] || densityProfiles.balanced;

  canvas.style.setProperty('--layout-width', `${previewWidth}px`);
  canvas.style.setProperty('--layout-height', `${previewHeight}px`);
  canvas.style.setProperty('--layout-padding-scale', profile.padding);
  canvas.style.setProperty('--layout-gap-scale', profile.gap);
  canvas.style.setProperty('--layout-type-scale', profile.type);
  canvas.dataset.layout = layout.id;
  canvas.dataset.orientation = layout.orientation;
  canvas.dataset.density = density;

  namePreview.textContent = `${layout.name} · ${profile.label}`;
  sizePreview.textContent = `${layout.width} × ${layout.height}`;
}

async function loadDesignSystem() {
  try {
    const response = await fetch('data/design-system.json');
    if (!response.ok) return fallbackLayouts;
    const designSystem = await response.json();
    return designSystem.layout || fallbackLayouts;
  } catch (error) {
    return fallbackLayouts;
  }
}

async function initializeLayoutEngine() {
  const canvas = document.getElementById('designCanvas');
  const layoutPresetInput = document.getElementById('layoutPresetInput');
  const layoutDensityInput = document.getElementById('layoutDensityInput');
  const namePreview = document.getElementById('layoutNamePreview');
  const sizePreview = document.getElementById('layoutSizePreview');
  const layouts = buildLayoutOptions(await loadDesignSystem());

  populateLayoutSelect(layoutPresetInput, layouts);

  const syncLayout = () => {
    const layout = layouts.find(({ id }) => id === layoutPresetInput.value) || layouts[0];
    applyLayout({
      canvas,
      layout,
      density: layoutDensityInput.value,
      namePreview,
      sizePreview,
    });
  };

  layoutPresetInput.value = layouts.some(({ id }) => id === 'poster') ? 'poster' : layouts[0].id;
  layoutPresetInput.addEventListener('change', syncLayout);
  layoutDensityInput.addEventListener('change', syncLayout);
  syncLayout();
}

textBindings.forEach(({ inputId, previewId }) => {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  input.addEventListener('input', () => syncTextPreview(input, preview));
  syncTextPreview(input, preview);
});

imageBindings.forEach(({ inputId, previewId }) => {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  input.addEventListener('change', () => syncImagePreview(input, preview));
});

initializeLayoutEngine();
