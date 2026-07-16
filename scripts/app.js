const POSTER_DATA_URL = 'data/poster.json';

const fallbackPosterData = {
  content: {
    title: '重新理解职业教育',
    subtitle: '青年发展 · 真实世界 · 行动可能',
    body: '职业教育不只是“就业前的技能训练”，也不只是传统意义上的升学替代路径。它连接着青年如何认识自我、理解劳动、进入产业、参与城市生活，以及在快速变化的社会中持续学习与成长。',
    event: '7月20日｜成都\n分享 · 讨论\n欢迎关注职业教育与青年发展的伙伴参与',
  },
  brand: {
    name: 'HOPE 学堂',
    logo: '',
    qrCode: '',
    style: {
      background: 'linear-gradient(135deg, rgba(120, 185, 67, 0.08), transparent 38%), linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%)',
    },
  },
  theme: {
    root: {
      style: {
        borderRadius: '28px',
        color: '#202733',
      },
    },
    components: {
      Text: { style: { margin: '0' } },
    },
  },
  layout: {
    size: { width: 1080, height: 1440 },
    renderTree: {
      id: 'poster-root',
      type: 'Container',
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px',
        overflow: 'hidden',
      },
      children: [
        {
          id: 'brand-ribbon',
          type: 'Container',
          style: {
            position: 'absolute',
            top: '32px',
            right: '32px',
            display: 'flex',
            gap: '8px',
          },
          children: [
            { id: 'ribbon-blue', type: 'Container', style: { width: '42px', height: '8px', borderRadius: '999px', background: '#388BCB' } },
            { id: 'ribbon-green', type: 'Container', style: { width: '42px', height: '8px', borderRadius: '999px', background: '#78B943' } },
            { id: 'ribbon-yellow', type: 'Container', style: { width: '42px', height: '8px', borderRadius: '999px', background: '#F6C500' } },
          ],
        },
        { id: 'logo', type: 'Logo', style: { width: '94px', height: '94px', marginBottom: '116px', borderRadius: '24px', background: '#eef7ff', border: '1px solid rgba(56, 139, 203, 0.16)' } },
        {
          id: 'content',
          type: 'Container',
          style: { maxWidth: '760px' },
          children: [
            { id: 'subtitle', type: 'Text', bind: 'subtitle', style: { marginBottom: '18px', color: '#78B943', fontSize: '34px', fontWeight: '700', lineHeight: '1.45' } },
            { id: 'title', type: 'Text', bind: 'title', style: { marginBottom: '32px', fontSize: '88px', fontWeight: '800', lineHeight: '0.96', letterSpacing: '-0.075em' } },
            { id: 'body', type: 'Text', bind: 'body', style: { color: '#3b4653', fontSize: '28px', lineHeight: '1.78', whiteSpace: 'pre-wrap' } },
          ],
        },
        {
          id: 'footer',
          type: 'Container',
          style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '28px', marginTop: 'auto', paddingTop: '72px' },
          children: [
            { id: 'event', type: 'Text', bind: 'event', style: { color: '#6f7b88', fontSize: '22px', fontWeight: '650', lineHeight: '1.65', whiteSpace: 'pre-wrap' } },
            { id: 'qr', type: 'QRCode', style: { width: '118px', height: '118px', borderRadius: '22px', background: '#f3faee', border: '1px solid rgba(120, 185, 67, 0.18)' } },
          ],
        },
      ],
    },
  },
};

const SUPPORTED_NODE_TYPES = new Set(['Container', 'Text', 'Image', 'QRCode', 'Logo']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeObjects(...objects) {
  return objects.reduce((merged, object) => (isObject(object) ? { ...merged, ...object } : merged), {});
}

function assertSupportedType(type) {
  if (!SUPPORTED_NODE_TYPES.has(type)) throw new Error(`Unsupported RenderTree node type: ${type}`);
}

function getContentValue(content, binding) {
  if (!binding) return undefined;
  if (typeof binding === 'function') return binding(content);
  if (typeof binding === 'string') return content[binding];
  if (Array.isArray(binding)) return binding.reduce((current, key) => (isObject(current) ? current[key] : undefined), content);
  return undefined;
}

function getBrandAsset(brand, type) {
  if (type === 'Logo') return brand.logo || brand.assets?.logo;
  if (type === 'QRCode') return brand.qrCode || brand.assets?.qrCode;
  return undefined;
}

function createEmptyNode(id, type = 'Container') {
  assertSupportedType(type);
  return { id, type, style: {}, layout: {}, children: [] };
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

  Object.entries(inferNodePayload(rawNode, context.content, context.brand)).forEach(([key, value]) => {
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

class PosterRenderer {
  constructor(target) {
    this.target = target;
  }

  render(renderTree) {
    this.applyRoot(renderTree);
    this.target.replaceChildren(...renderTree.children.map((child) => this.createElement(child)));
    this.target.classList.add('is-rendered-from-json');
  }

  applyRoot(renderTree) {
    const width = Number.parseFloat(renderTree.layout.width) || 1080;
    const height = Number.parseFloat(renderTree.layout.height) || 1440;
    const scale = Math.min(1, 680 / width, 760 / height);

    Object.assign(this.target.style, renderTree.style, {
      width: `${Math.round(width * scale)}px`,
      minHeight: `${Math.round(height * scale)}px`,
    });
    this.target.dataset.nodeId = renderTree.id;
    this.target.dataset.nodeType = renderTree.type;
  }

  createElement(node) {
    const element = node.type === 'Text' ? document.createElement('p') : document.createElement('div');
    element.dataset.nodeId = node.id;
    element.dataset.nodeType = node.type;
    Object.assign(element.style, node.style, node.layout);

    if (node.type === 'Text') {
      element.textContent = node.text || '';
    } else if (node.type === 'Image' || node.type === 'Logo' || node.type === 'QRCode') {
      this.renderImageNode(element, node);
    } else {
      node.children.forEach((child) => element.append(this.createElement(child)));
    }

    return element;
  }

  renderImageNode(element, node) {
    if (!node.src) {
      element.setAttribute('aria-label', `${node.type} placeholder`);
      return;
    }

    const image = document.createElement('img');
    image.src = node.src;
    image.alt = node.alt || node.type;
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'contain';
    image.style.borderRadius = 'inherit';
    element.append(image);
  }
}

async function readPosterJson() {
  try {
    const response = await fetch(POSTER_DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to read ${POSTER_DATA_URL}`);
    return response.json();
  } catch (error) {
    console.warn(error);
    return fallbackPosterData;
  }
}

async function generatePoster() {
  const canvas = document.getElementById('designCanvas');
  const statusName = document.getElementById('layoutNamePreview');
  const statusSize = document.getElementById('layoutSizePreview');
  const posterJson = await readPosterJson();
  const renderTree = buildRenderTree(posterJson);
  const renderer = new PosterRenderer(canvas);

  renderer.render(renderTree);

  const width = renderTree.layout.width || 1080;
  const height = renderTree.layout.height || 1440;
  statusName.textContent = posterJson.brand?.name || 'JSON Poster';
  statusSize.textContent = `${width} × ${height}`;
}

generatePoster();
