import { describe, expect, it } from 'vitest';

import { getFlexLayoutPosition } from './geometry';

describe('grid drag positions', () => {
  const item = { index: 4, size: 3, width: 90, height: 126 };

  it('matches the switcher row and column gaps for a second-row item', () => {
    expect(getFlexLayoutPosition({ ...item, gap: { x: 32, y: 16 }, direction: 'row' })).toEqual({ x: 122, y: 142 });
    expect(getFlexLayoutPosition({ ...item, gap: { x: 32, y: 16 }, direction: 'row-reverse' })).toEqual({ x: -122, y: 142 });
  });

  it('uses the width on the horizontal axis and height on the vertical axis in column layouts', () => {
    expect(getFlexLayoutPosition({ ...item, gap: { x: 32, y: 16 }, direction: 'column' })).toEqual({ x: 122, y: 142 });
    expect(getFlexLayoutPosition({ ...item, gap: { x: 32, y: 16 }, direction: 'column-reverse' })).toEqual({ x: 122, y: -142 });
  });

  it('preserves scalar-gap callers', () => {
    expect(getFlexLayoutPosition({ ...item, gap: 12, direction: 'row' })).toEqual({ x: 102, y: 138 });
  });
});
