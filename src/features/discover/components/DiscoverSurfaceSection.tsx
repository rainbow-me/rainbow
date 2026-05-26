import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMarketSurface, MarketSurfaceSection } from '@/features/discover/components/MarketSurfaceSection';
import { isPredictionsSurface, PredictionsSurfaceSection } from '@/features/discover/components/PredictionsSurfaceSection';
import { type Surface, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { logger } from '@/logger';

type DiscoverSurfaceSectionsProps = {
  items: Surface[];
  surfaceId: string;
};

const SECTION_VERTICAL_GAP = 32;

export function DiscoverSurfaceSections({ items, surfaceId }: DiscoverSurfaceSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSurfaceSection key={item.id} surface={item} surfaceId={surfaceId} />
      ))}
    </View>
  );
}

export const DiscoverSurfaceSection = memo(function DiscoverSurfaceSection({
  surface,
  surfaceId,
}: {
  surface: Surface;
  surfaceId: string;
}) {
  if (surface.items !== undefined) return <DiscoverSurfaceSections items={surface.items} surfaceId={surfaceId} />;

  if (isMarketSurface(surface)) return <MarketSurfaceSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSurfaceSection surface={surface} surfaceId={surfaceId} />;

  return unsupportedDisplay(surface.display);
});

function unsupportedDisplay(display: SurfaceLeaf['display']) {
  logger.warn('[DiscoverSurfaceSection]: unsupported surface display', { display });
  return null;
}

const styles = StyleSheet.create({
  container: {
    gap: SECTION_VERTICAL_GAP,
    paddingBottom: 24,
    paddingTop: 20,
  },
});
