import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMarketSurface, MarketSection } from '@/features/discover/components/MarketSection';
import { isPredictionsSurface, PredictionsSection } from '@/features/discover/components/PredictionsSection';
import { type DiscoverViewport } from '@/features/discover/types/sectionLayout';
import { type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';

type DiscoverSectionsProps = {
  items: SurfaceLeafNode[];
  surfaceId: SurfaceId;
  viewport: DiscoverViewport;
  active: boolean;
};

export function DiscoverSections({ items, surfaceId, viewport, active }: DiscoverSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSection key={item.id} surface={item} surfaceId={surfaceId} viewport={viewport} active={active} />
      ))}
    </View>
  );
}

export const DiscoverSection = memo(function DiscoverSection({
  surface,
  surfaceId,
  viewport,
  active,
}: {
  surface: SurfaceLeafNode;
  surfaceId: SurfaceId;
  viewport: DiscoverViewport;
  active: boolean;
}) {
  if (isMarketSurface(surface)) return <MarketSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface))
    return <PredictionsSection surface={surface} surfaceId={surfaceId} viewport={viewport} active={active} />;
  return null;
});

const styles = StyleSheet.create({
  container: {
    gap: 32,
    paddingBottom: 24,
    paddingTop: 20,
  },
});
