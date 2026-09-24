import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { isMarketSurface, MarketSection } from '@/features/discover/components/MarketSection';
import { isPredictionsSurface, PredictionsSection } from '@/features/discover/components/PredictionsSection';
import { type SectionId, type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';

type DiscoverSectionsProps = {
  items: SurfaceLeafNode[];
  sectionId: SectionId;
  surfaceId: SurfaceId;
};

export function DiscoverSections({ items, sectionId, surfaceId }: DiscoverSectionsProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <DiscoverSection key={item.id} sectionId={sectionId} surface={item} surfaceId={surfaceId} />
      ))}
    </View>
  );
}

export const DiscoverSection = memo(function DiscoverSection({
  sectionId,
  surface,
  surfaceId,
}: {
  sectionId: SectionId;
  surface: SurfaceLeafNode;
  surfaceId: SurfaceId;
}) {
  if (isMarketSurface(surface)) return <MarketSection surface={surface} surfaceId={surfaceId} />;
  if (isPredictionsSurface(surface)) return <PredictionsSection sectionId={sectionId} surface={surface} surfaceId={surfaceId} />;
  return null;
});

const styles = StyleSheet.create({
  container: {
    gap: 32,
    paddingBottom: 24,
    paddingTop: 20,
  },
});
