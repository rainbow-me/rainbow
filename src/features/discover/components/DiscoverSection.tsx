import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMarketSurface, MarketSection } from '@/features/discover/components/MarketSection';
import { isPredictionsSurface, PredictionsSection } from '@/features/discover/components/PredictionsSection';
import { type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';

type DiscoverSectionsProps = {
  items: SurfaceLeafNode[];
  surfaceId: SurfaceId;
};

export function DiscoverSections({ items, surfaceId }: DiscoverSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSection key={item.id} surface={item} surfaceId={surfaceId} />
      ))}
    </View>
  );
}

export const DiscoverSection = memo(function DiscoverSection({ surface, surfaceId }: { surface: SurfaceLeafNode; surfaceId: SurfaceId }) {
  if (isMarketSurface(surface)) return <MarketSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSection surface={surface} surfaceId={surfaceId} />;
  return null;
});

const styles = StyleSheet.create({
  container: {
    gap: 32,
    paddingBottom: 24,
    paddingTop: 20,
  },
});
