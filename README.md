# HOPE Studio OS Layout Engine

A small deterministic layout engine for constructing editor and runtime surfaces. It accepts a JSON layout tree and returns absolute rectangles for each node.

## Install

```bash
npm install
```

## Test

```bash
npm test
```

## Example

```js
import { layout } from './src/layout-engine.js';

const frame = layout({
  id: 'root',
  width: 800,
  height: 600,
  padding: 16,
  gap: 8,
  children: [
    { id: 'toolbar', layout: 'leaf', height: 48 },
    { id: 'canvas', layout: 'leaf', grow: 1 },
  ],
});
```

## Node schema

- `id`: stable node identifier.
- `layout`: `stack`, `grid`, `absolute`, or `leaf`.
- `direction`: `vertical` or `horizontal` for stack nodes.
- `x`, `y`, `width`, `height`: dimensions in pixels. Width and height may also be percentages.
- `padding`: a number or `{ top, right, bottom, left }`.
- `gap`: spacing between stack or grid children.
- `grow`: stack child weight for consuming remaining space.
- `columns`, `rowHeight`: grid controls.
- `children`: nested layout nodes.
