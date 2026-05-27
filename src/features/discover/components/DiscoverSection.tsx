import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMarketSurface, MarketSection } from '@/features/discover/components/MarketSection';
import { isPredictionsSurface, PredictionsSection } from '@/features/discover/components/PredictionsSection';
import { type SurfaceLeaf, type SurfaceNode } from '@/features/placements/surfaces/types';
import { logger } from '@/logger';

type DiscoverSectionsProps = {
  items: SurfaceNode[];
  surfaceId: string;
};

const SECTION_VERTICAL_GAP = 32;

export function DiscoverSections({ items, surfaceId }: DiscoverSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSection key={item.id} surface={item} surfaceId={surfaceId} />
      ))}
    </View>
  );
}

export const DiscoverSection = memo(function DiscoverSection({ surface, surfaceId }: { surface: SurfaceNode; surfaceId: string }) {
  if ('items' in surface) return <DiscoverSections items={surface.items} surfaceId={surfaceId} />;

  if (isMarketSurface(surface)) return <MarketSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSection surface={surface} surfaceId={surfaceId} />;

  return unsupportedDisplay(surface.display);
});

function unsupportedDisplay(display: SurfaceLeaf['display']) {
  logger.warn('[DiscoverSection]: unsupported surface display', { display });
  return null;
}

const styles = StyleSheet.create({
  container: {
    gap: SECTION_VERTICAL_GAP,
    paddingBottom: 24,
    paddingTop: 20,
  },
});
