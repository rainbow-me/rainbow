import { DiscoverSurfaceSections } from '@/features/discover/components/DiscoverSurfaceSection';
import { useDiscoverSurface } from '@/features/placements/surfaces/hooks/useSurface';
import { isSurfaceContainer } from '@/features/placements/surfaces/utils/surfaceGuards';

export function DiscoverHome() {
  const surface = useDiscoverSurface();
  const firstTab = surface && isSurfaceContainer(surface) ? surface.items[0] : undefined;

  if (!firstTab) return null;

  return isSurfaceContainer(firstTab) ? (
    <DiscoverSurfaceSections items={firstTab.items} surfaceId={surface.id} />
  ) : (
    <DiscoverSurfaceSections items={[firstTab]} surfaceId={surface.id} />
  );
}
