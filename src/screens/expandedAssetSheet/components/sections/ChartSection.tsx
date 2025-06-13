import React, { memo } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { Chart } from '@/components/value-chart/Chart';
import { Bleed } from '@/design-system';

export const ChartSection = memo(function ChartSection() {
  const { basicAsset: asset, accentColors } = useExpandedAssetSheetContext();
  return (
    <Bleed horizontal="24px">
      <Chart asset={asset} backgroundColor={accentColors.background} color={accentColors.color} />
    </Bleed>
  );
});
