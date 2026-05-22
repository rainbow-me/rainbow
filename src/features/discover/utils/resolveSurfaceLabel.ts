import { type Surface } from '@/features/placements/surfaces/types';

export function resolveSurfaceLabel(surface: Surface): string {
  return surface.label || surface.id;
}
