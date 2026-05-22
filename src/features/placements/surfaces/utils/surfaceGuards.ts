import { type Surface, type SurfaceContainer } from '@/features/placements/surfaces/types';

export function isSurfaceContainer(surface: Surface): surface is SurfaceContainer {
  return Array.isArray((surface as SurfaceContainer).items);
}
