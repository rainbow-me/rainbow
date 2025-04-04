import React, { memo } from 'react';
import * as i18n from '@/languages';
import { Box } from '@/design-system';
// import { MarketStatsCard } from './MarketStatsCard';
import { AssetInfoList } from './AssetInfoList';
import { CollapsibleSection, LAYOUT_ANIMATION } from '../../shared/CollapsibleSection';
import { SheetSeparator } from '../../shared/Separator';
import { SectionId } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import Animated from 'react-native-reanimated';

export const MarketStatsSection = memo(function MarketStatsSection() {
  {
    /* BLOCKED: blocked by backend for data */
  }
  {
    /*content={<MarketStatsCard />} */
  }
  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<AssetInfoList />}
        icon="􀑃"
        id={SectionId.MARKET_STATS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.market_stats.title)}
      />
      <SheetSeparator />
    </Box>
  );
});
