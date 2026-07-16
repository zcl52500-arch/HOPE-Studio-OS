/**
 * Deterministic two-dimensional layout engine for editor/runtime surfaces.
 *
 * The engine supports a compact scene tree with four layout modes:
 * - `stack`: lays children on the vertical or horizontal axis.
 * - `grid`: places children into fixed-width columns and auto-created rows.
 * - `absolute`: positions children by their own offsets without flow.
 * - `leaf`: returns a measured rectangle with no child layout.
 */

const DEFAULT_NODE = Object.freeze({
  id: 'root',
  layout: 'stack',
  direction: 'vertical',
  children: Object.freeze([]),
});

/**
 * Creates a layout tree and returns absolute rectangles for every node.
 *
 * @param {object} node root layout node
 * @param {object} [viewport] fallback available space
 * @param {number} [viewport.width=0] fallback width
 * @param {number} [viewport.height=0] fallback height
 * @returns {{id: string, x: number, y: number, width: number, height: number, children: Array} & object}
 */
export function layout(node = DEFAULT_NODE, viewport = {}) {
  const normalizedRoot = normalizeNode(node, 0);
  const rootWidth = resolveSize(normalizedRoot.width, viewport.width ?? 0);
  const rootHeight = resolveSize(normalizedRoot.height, viewport.height ?? 0);

  return computeNode(normalizedRoot, {
    x: numberOrZero(normalizedRoot.x),
    y: numberOrZero(normalizedRoot.y),
    width: rootWidth,
    height: rootHeight,
  }, true);
}

function computeNode(node, frame, frameIsResolved = false) {
  const padding = expandBox(node.padding);
  const width = clamp(frameIsResolved ? frame.width : resolveSize(node.width, frame.width), node.minWidth, node.maxWidth);
  const height = clamp(frameIsResolved ? frame.height : resolveSize(node.height, frame.height), node.minHeight, node.maxHeight);
  const resolvedFrame = {
    x: round(frame.x + numberOrZero(node.x)),
    y: round(frame.y + numberOrZero(node.y)),
    width: round(width),
    height: round(height),
  };

  const contentFrame = {
    x: resolvedFrame.x + padding.left,
    y: resolvedFrame.y + padding.top,
    width: Math.max(0, resolvedFrame.width - padding.left - padding.right),
    height: Math.max(0, resolvedFrame.height - padding.top - padding.bottom),
  };

  const children = layoutChildren(node, contentFrame);
  return {
    id: node.id,
    layout: node.layout,
    ...resolvedFrame,
    children,
  };
}

function layoutChildren(node, contentFrame) {
  if (!node.children.length || node.layout === 'leaf') return [];
  if (node.layout === 'absolute') return layoutAbsolute(node.children, contentFrame);
  if (node.layout === 'grid') return layoutGrid(node, contentFrame);
  return layoutStack(node, contentFrame);
}

function layoutAbsolute(children, contentFrame) {
  return children.map((child) => computeNode(child, {
    x: contentFrame.x,
    y: contentFrame.y,
    width: contentFrame.width,
    height: contentFrame.height,
  }));
}

function layoutStack(node, contentFrame) {
  const direction = node.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const gap = numberOrZero(node.gap);
  const mainSize = direction === 'horizontal' ? contentFrame.width : contentFrame.height;
  const crossSize = direction === 'horizontal' ? contentFrame.height : contentFrame.width;
  const fixedTotal = node.children.reduce((total, child) => {
    const requested = direction === 'horizontal' ? child.width : child.height;
    return total + (isAuto(requested) && child.grow ? 0 : resolveSize(requested, 0));
  }, 0);
  const totalGap = gap * Math.max(0, node.children.length - 1);
  const growTotal = node.children.reduce((total, child) => total + (isAuto(direction === 'horizontal' ? child.width : child.height) ? numberOrZero(child.grow) : 0), 0);
  const growSpace = Math.max(0, mainSize - fixedTotal - totalGap);

  let cursor = direction === 'horizontal' ? contentFrame.x : contentFrame.y;
  return node.children.map((child) => {
    const childMain = resolveStackMainSize(child, direction, growTotal, growSpace);
    const childCross = resolveSize(direction === 'horizontal' ? child.height : child.width, crossSize);
    const frame = direction === 'horizontal'
      ? { x: cursor, y: contentFrame.y, width: childMain, height: childCross }
      : { x: contentFrame.x, y: cursor, width: childCross, height: childMain };
    cursor += childMain + gap;
    return computeNode(child, frame, true);
  });
}

function resolveStackMainSize(child, direction, growTotal, growSpace) {
  const requested = direction === 'horizontal' ? child.width : child.height;
  if (!isAuto(requested)) return resolveSize(requested, 0);
  const grow = numberOrZero(child.grow);
  if (!grow || !growTotal) return 0;
  return (growSpace * grow) / growTotal;
}

function layoutGrid(node, contentFrame) {
  const gap = numberOrZero(node.gap);
  const columns = Math.max(1, Math.floor(numberOrZero(node.columns) || 1));
  const columnWidth = (contentFrame.width - gap * (columns - 1)) / columns;
  const rowHeight = resolveSize(node.rowHeight, columnWidth);

  return node.children.map((child, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return computeNode(child, {
      x: contentFrame.x + column * (columnWidth + gap),
      y: contentFrame.y + row * (rowHeight + gap),
      width: resolveSize(child.width, columnWidth),
      height: resolveSize(child.height, rowHeight),
    });
  });
}

function normalizeNode(node, index) {
  const source = node ?? {};
  return {
    ...source,
    id: String(source.id ?? `node-${index}`),
    layout: ['stack', 'grid', 'absolute', 'leaf'].includes(source.layout) ? source.layout : 'stack',
    direction: source.direction === 'horizontal' ? 'horizontal' : 'vertical',
    children: Array.isArray(source.children) ? source.children.map(normalizeNode) : [],
  };
}

function resolveSize(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = Number.parseFloat(value.slice(0, -1));
    return Number.isFinite(percentage) ? Math.max(0, fallback * (percentage / 100)) : Math.max(0, fallback);
  }
  return Math.max(0, numberOrZero(fallback));
}

function expandBox(value) {
  if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value };
  if (!value || typeof value !== 'object') return { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    top: numberOrZero(value.top),
    right: numberOrZero(value.right),
    bottom: numberOrZero(value.bottom),
    left: numberOrZero(value.left),
  };
}

function clamp(value, min, max) {
  const withMin = typeof min === 'number' ? Math.max(value, min) : value;
  return typeof max === 'number' ? Math.min(withMin, max) : withMin;
}

function isAuto(value) {
  return value === undefined || value === null || value === 'auto';
}

function numberOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
