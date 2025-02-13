import React from 'react';
import { Stack } from '@/design-system';
// import { MarketStatsCard } from './MarketStatsCard';
import { AssetInfoList } from './AssetInfoList';

export function MarketStatsSection() {
  return (
    <Stack space="24px">
      {/* BLOCKED: blocked by backend for data */}
      {/* <MarketStatsCard /> */}
      <AssetInfoList />
    </Stack>
  );
}
