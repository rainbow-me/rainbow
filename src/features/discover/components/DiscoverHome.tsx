import { DiscoverSurfaceSections } from '@/features/discover/components/DiscoverSurfaceSection';
import { useDiscoverSurface } from '@/features/placements/surfaces/hooks/useSurface';

export function DiscoverHome() {
  const surface = useDiscoverSurface();
  const firstTab = surface?.items !== undefined ? surface.items[0] : undefined;

  if (!surface || !firstTab) return null;

  return firstTab.items !== undefined ? (
    <DiscoverSurfaceSections items={firstTab.items} surfaceId={surface.id} />
  ) : (
    <DiscoverSurfaceSections items={[firstTab]} surfaceId={surface.id} />
  );
}
