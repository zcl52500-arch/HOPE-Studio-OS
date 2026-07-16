const SUPPORTED_NODE_TYPES = new Set(['Container', 'Text', 'Image', 'QRCode', 'Logo']);
const STYLE_ALIASES = {
  backgroundColor: 'background-color',
  backgroundImage: 'background-image',
  borderColor: 'border-color',
  borderRadius: 'border-radius',
  borderStyle: 'border-style',
  borderWidth: 'border-width',
  boxShadow: 'box-shadow',
  color: 'color',
  display: 'display',
  flex: 'flex',
  flexDirection: 'flex-direction',
  flexWrap: 'flex-wrap',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontStyle: 'font-style',
  fontWeight: 'font-weight',
  gap: 'gap',
  height: 'height',
  justifyContent: 'justify-content',
  letterSpacing: 'letter-spacing',
  lineHeight: 'line-height',
  margin: 'margin',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  marginRight: 'margin-right',
  marginTop: 'margin-top',
  maxHeight: 'max-height',
  maxWidth: 'max-width',
  minHeight: 'min-height',
  minWidth: 'min-width',
  objectFit: 'object-fit',
  opacity: 'opacity',
  overflow: 'overflow',
  padding: 'padding',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  paddingRight: 'padding-right',
  paddingTop: 'padding-top',
  position: 'position',
  textAlign: 'text-align',
  textDecoration: 'text-decoration',
  textTransform: 'text-transform',
  width: 'width',
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertSupportedNode(node) {
  if (!isObject(node)) {
    throw new Error('PosterRenderer expected a RenderTree node object.');
  }

  if (!SUPPORTED_NODE_TYPES.has(node.type)) {
    throw new Error(`Unsupported RenderTree node type: ${node.type}`);
  }
}

function createElement(documentRef, tagName, className) {
  const element = documentRef.createElement(tagName);
  element.className = className;
  return element;
}

function normalizeStyleName(name) {
  if (STYLE_ALIASES[name]) return STYLE_ALIASES[name];
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function normalizeStyleValue(value) {
  if (typeof value === 'number') return `${value}px`;
  return String(value);
}

function applyStyles(element, styles = {}, layout = {}) {
  const mergedStyles = { ...layout, ...styles };

  Object.entries(mergedStyles).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.style.setProperty(normalizeStyleName(name), normalizeStyleValue(value));
  });
}

function applyNodeAttributes(element, node) {
  if (node.id) element.dataset.renderNodeId = node.id;
  element.dataset.renderNodeType = node.type;

  if (node.role) element.setAttribute('role', node.role);
  if (node.ariaLabel) element.setAttribute('aria-label', node.ariaLabel);
}

function appendChildren(element, node, context) {
  const children = Array.isArray(node.children) ? node.children : [];
  children.forEach((child) => element.append(renderNode(child, context)));
}

function renderContainer(node, context) {
  const element = createElement(context.document, 'div', 'poster-node poster-container');
  appendChildren(element, node, context);
  return element;
}

function renderText(node, context) {
  const element = createElement(context.document, 'p', 'poster-node poster-text');
  element.textContent = node.text === undefined || node.text === null ? '' : String(node.text);
  appendChildren(element, node, context);
  return element;
}

function renderImageLike(node, context) {
  const element = createElement(context.document, 'img', `poster-node poster-image poster-${node.type.toLowerCase()}`);

  if (node.src) element.src = node.src;
  element.alt = node.alt || node.label || node.type;

  return element;
}

function renderNode(node, context) {
  assertSupportedNode(node);

  const renderers = {
    Container: renderContainer,
    Text: renderText,
    Image: renderImageLike,
    QRCode: renderImageLike,
    Logo: renderImageLike,
  };
  const element = renderers[node.type](node, context);

  applyNodeAttributes(element, node);
  applyStyles(element, node.style, node.layout);

  return element;
}

function resolveDocument(options = {}) {
  const documentRef = options.document || globalThis.document;

  if (!documentRef || typeof documentRef.createElement !== 'function') {
    throw new Error('PosterRenderer requires a DOM document. Pass { document } or run in a browser.');
  }

  return documentRef;
}

function renderPoster(renderTree, options = {}) {
  return renderNode(renderTree, { document: resolveDocument(options) });
}

module.exports = {
  SUPPORTED_NODE_TYPES,
  renderPoster,
  renderNode,
};
