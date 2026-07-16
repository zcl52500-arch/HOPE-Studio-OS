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
