import React, { memo } from 'react';
import * as i18n from '@/languages';
import { Box } from '@/design-system';
import { MarketStatsCard } from './MarketStatsCard';
import { CollapsibleSection, LAYOUT_ANIMATION } from '../../shared/CollapsibleSection';
import { SheetSeparator } from '../../shared/Separator';
import { SectionId, useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import Animated from 'react-native-reanimated';
import { useTokenMarketStats } from '@/resources/metadata/tokenStats';

export const MarketStatsSection = memo(function MarketStatsSection() {
  const { basicAsset: asset } = useExpandedAssetSheetContext();

  const { data: marketData } = useTokenMarketStats({ chainID: asset.chainId, address: asset.address });

  if (!marketData || Object.keys(marketData).length === 0) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<MarketStatsCard marketData={marketData} />}
        icon="􀑃"
        id={SectionId.MARKET_STATS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.market_stats.title)}
      />
      <SheetSeparator />
    </Box>
  );
});
