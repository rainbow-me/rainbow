import React, { memo } from 'react';

import Animated from 'react-native-reanimated';

import { Box } from '@/design-system';
import * as i18n from '@/languages';
import { CollapsibleSection, LAYOUT_ANIMATION } from '@/screens/expandedAssetSheet/components/shared/CollapsibleSection';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { SectionId } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';

import { AssetInfoList } from './AssetInfoList';
import { MarketStatsCard } from './MarketStatsCard';

export const MarketStatsSection = memo(function MarketStatsSection() {
  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={
          <Box gap={24}>
            <MarketStatsCard />
            <AssetInfoList />
          </Box>
        }
        icon="􀑃"
        id={SectionId.MARKET_STATS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.market_stats.title)}
      />
      <SheetSeparator />
    </Box>
  );
});
