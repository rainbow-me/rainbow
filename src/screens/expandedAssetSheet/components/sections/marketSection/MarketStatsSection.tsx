import React, { memo } from 'react';
import { Stack } from '@/design-system';
import { MarketStatsCard } from './MarketStatsCard';
import { AssetInfoList } from './AssetInfoList';

export const MarketStatsSection = memo(function MarketStatsSection() {
  return (
    <Stack space="24px">
      <MarketStatsCard />
      <AssetInfoList />
    </Stack>
  );
});
