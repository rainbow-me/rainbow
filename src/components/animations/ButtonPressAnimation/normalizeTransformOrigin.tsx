import type { TransformOrigin } from './types';

export function normalizeTransformOrigin(transformOrigin: TransformOrigin | string | undefined): TransformOrigin {
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
      return [0.5, 1];
    default:
      return [0.5, 0.5];
  }
}
