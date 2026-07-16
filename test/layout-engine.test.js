import test from 'node:test';
import assert from 'node:assert/strict';
import { layout } from '../src/layout-engine.js';

test('lays out vertical stacks with padding, gap, and grow', () => {
  const result = layout({
    id: 'root',
    width: 200,
    height: 120,
    padding: 10,
    gap: 5,
    children: [
      { id: 'toolbar', layout: 'leaf', height: 20 },
      { id: 'canvas', layout: 'leaf', grow: 1 },
      { id: 'status', layout: 'leaf', height: 10 },
    ],
  });

  assert.deepEqual(result.children.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })), [
    { id: 'toolbar', x: 10, y: 10, width: 180, height: 20 },
    { id: 'canvas', x: 10, y: 35, width: 180, height: 60 },
    { id: 'status', x: 10, y: 100, width: 180, height: 10 },
  ]);
});

test('distributes horizontal grow space by grow weights', () => {
  const result = layout({
    id: 'root',
    direction: 'horizontal',
    width: 300,
    height: 50,
    gap: 10,
    children: [
      { id: 'left', layout: 'leaf', width: 40 },
      { id: 'main', layout: 'leaf', grow: 2 },
      { id: 'right', layout: 'leaf', grow: 1 },
    ],
  });

  assert.equal(result.children[1].width, 160);
  assert.equal(result.children[2].x, 220);
  assert.equal(result.children[2].width, 80);
});

test('places grid children into columns and rows', () => {
  const result = layout({
    id: 'grid',
    layout: 'grid',
    width: 320,
    height: 200,
    columns: 3,
    rowHeight: 40,
    gap: 10,
    children: [
      { id: 'a', layout: 'leaf' },
      { id: 'b', layout: 'leaf' },
      { id: 'c', layout: 'leaf' },
      { id: 'd', layout: 'leaf' },
    ],
  });

  assert.deepEqual(result.children.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })), [
    { id: 'a', x: 0, y: 0, width: 100, height: 40 },
    { id: 'b', x: 110, y: 0, width: 100, height: 40 },
    { id: 'c', x: 220, y: 0, width: 100, height: 40 },
    { id: 'd', x: 0, y: 50, width: 100, height: 40 },
  ]);
});

test('resolves absolute children and percentage sizes', () => {
  const result = layout({
    id: 'surface',
    layout: 'absolute',
    width: 400,
    height: 300,
    children: [
      { id: 'panel', layout: 'leaf', x: 20, y: 30, width: '50%', height: '25%' },
    ],
  });

  assert.deepEqual(result.children[0], {
    id: 'panel',
    layout: 'leaf',
    x: 20,
    y: 30,
    width: 200,
    height: 75,
    children: [],
  });
});
