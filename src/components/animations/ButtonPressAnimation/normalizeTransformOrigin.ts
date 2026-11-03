import { type TransformOrigin } from './types';

/**
 * Normalizes an origin to fractional `[x, y]` coordinates, from `[0, 0]` at the
 * top-left to `[1, 1]` at the bottom-right. Absent or unsupported origins return `undefined`.
 */
export function normalizeTransformOrigin(transformOrigin: TransformOrigin | string | undefined): TransformOrigin | undefined {
  if (Array.isArray(transformOrigin) && transformOrigin.length === 2) {
    return transformOrigin;
  }

  switch (transformOrigin) {
    case 'bottom':
      return [0.5, 1];
    case 'left':
      return [0, 0.5];
    case 'right':
      return [1, 0.5];
    case 'top':
      return [0.5, 0];
    default:
      return undefined;
  }
}
