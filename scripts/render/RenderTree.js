const fs = require('fs');
const path = require('path');

const SUPPORTED_NODE_TYPES = new Set(['Container', 'Text', 'Image', 'QRCode', 'Logo']);

function readJson(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(source);
}

function resolveInputPath(baseDir, fileName) {
  return path.resolve(baseDir, fileName);
}

function readRenderTreeInputs(baseDir = process.cwd()) {
  return {
    content: readJson(resolveInputPath(baseDir, 'content.json')),
    brand: readJson(resolveInputPath(baseDir, 'brand.json')),
    theme: readJson(resolveInputPath(baseDir, 'theme.json')),
    layout: readJson(resolveInputPath(baseDir, 'layout.json')),
  };
}

function createEmptyNode(id, type = 'Container') {
  assertSupportedType(type);

  return {
    id,
    type,
    style: {},
    layout: {},
    children: [],
  };
}

function assertSupportedType(type) {
  if (!SUPPORTED_NODE_TYPES.has(type)) {
    throw new Error(`Unsupported RenderTree node type: ${type}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeObjects(...objects) {
  return objects.reduce((merged, object) => {
    if (!isObject(object)) return merged;
    return { ...merged, ...object };
  }, {});
}

function getContentValue(content, binding) {
  if (!binding) return undefined;

  if (typeof binding === 'function') return binding(content);
  if (typeof binding === 'string') return content[binding];
  if (Array.isArray(binding)) {
    return binding.reduce((current, key) => (isObject(current) ? current[key] : undefined), content);
  }

  return undefined;
}

function getBrandAsset(brand, type) {
  if (type === 'Logo') return brand.logo || brand.assets?.logo;
  if (type === 'QRCode') return brand.qrCode || brand.assets?.qrCode;
  return undefined;
}

function inferNodePayload(node, content, brand) {
  const payload = {};
  const contentValue = getContentValue(content, node.bind || node.contentKey);

  if (contentValue !== undefined) {
    if (node.type === 'Text') payload.text = contentValue;
    if (node.type === 'Image' || node.type === 'QRCode' || node.type === 'Logo') payload.src = contentValue;
  }

  if (node.type === 'Logo' || node.type === 'QRCode') {
    const asset = getBrandAsset(brand, node.type);
    if (payload.src === undefined && asset !== undefined) payload.src = asset;
  }

  return payload;
}

function normalizeNode(node, context, fallbackId = 'root') {
  const rawNode = isObject(node) ? node : {};
  const type = rawNode.type || 'Container';
  assertSupportedType(type);

  const normalized = createEmptyNode(rawNode.id || fallbackId, type);
  const roleStyle = context.theme?.components?.[type] || context.theme?.[type] || {};

  normalized.style = mergeObjects(roleStyle.style || roleStyle, rawNode.style);
  normalized.layout = mergeObjects(rawNode.layout);

  const payload = inferNodePayload(rawNode, context.content, context.brand);
  Object.entries(payload).forEach(([key, value]) => {
    normalized[key] = value;
  });

  if (rawNode.text !== undefined) normalized.text = rawNode.text;
  if (rawNode.src !== undefined) normalized.src = rawNode.src;
  if (rawNode.alt !== undefined) normalized.alt = rawNode.alt;

  const children = Array.isArray(rawNode.children) ? rawNode.children : [];
  normalized.children = children.map((child, index) => normalizeNode(child, context, `${normalized.id}-${index + 1}`));

  return normalized;
}

function getLayoutRoot(layout) {
  if (isObject(layout.renderTree)) return layout.renderTree;
  if (isObject(layout.root)) return layout.root;
  if (Array.isArray(layout.children)) return layout;
  return createEmptyNode('root', 'Container');
}

function buildRenderTree({ content = {}, brand = {}, theme = {}, layout = {} } = {}) {
  const root = normalizeNode(getLayoutRoot(layout), { content, brand, theme }, 'root');
  root.style = mergeObjects(theme.root?.style, theme.canvas?.style, brand.style, root.style);
  root.layout = mergeObjects(layout.size, layout.layout, root.layout);
  return root;
}

function loadRenderTree(baseDir = process.cwd()) {
  return buildRenderTree(readRenderTreeInputs(baseDir));
}

module.exports = {
  SUPPORTED_NODE_TYPES,
  buildRenderTree,
  loadRenderTree,
  readRenderTreeInputs,
};

if (require.main === module) {
  const baseDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  process.stdout.write(`${JSON.stringify(loadRenderTree(baseDir), null, 2)}\n`);
}
