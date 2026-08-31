import type { Direction, TransformOrigin } from './types';

const CENTER: TransformOrigin = [0.5, 0.5];
const BOTTOM: TransformOrigin = [0.5, 1];
const LEFT: TransformOrigin = [0, 0.5];
const RIGHT: TransformOrigin = [1, 0.5];
const TOP: TransformOrigin = [0.5, 0];

export function normalizeTransformOrigin(transformOrigin: TransformOrigin | Direction | undefined): TransformOrigin {
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
      return CENTER;
  }
}
