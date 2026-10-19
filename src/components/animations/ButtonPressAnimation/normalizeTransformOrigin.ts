import { type Direction, type TransformOrigin } from './types';

const BOTTOM: TransformOrigin = [0.5, 1];
const LEFT: TransformOrigin = [0, 0.5];
const RIGHT: TransformOrigin = [1, 0.5];
const TOP: TransformOrigin = [0.5, 0];

/**
 * Normalizes an origin to fractional `[x, y]` coordinates, from `[0, 0]` at the
 * top-left to `[1, 1]` at the bottom-right. Absent or unsupported origins return `undefined`.
 */
export function normalizeTransformOrigin(transformOrigin: TransformOrigin | Direction | undefined): TransformOrigin | undefined {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return transformOrigin;
  }

  switch (transformOrigin) {
    case 'bottom':
      return BOTTOM;
    case 'left':
      return LEFT;
    case 'right':
      return RIGHT;
    case 'top':
      return TOP;
    default:
      return undefined;
  }
}
