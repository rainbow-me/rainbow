import React, { memo, useMemo } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';

export const ChartSection = memo(function ChartSection() {
  const { asset } = useExpandedAssetSheetContext();

  const { nativeCurrency } = useAccountSettings();

  const hasBalance = asset?.balance;

  const { data: genericAsset } = useExternalToken({
    address: asset?.address,
    chainId: asset?.chainId,
    currency: nativeCurrency,
  });

  const assetWithPrice = useMemo(() => {
    return hasBalance
      ? asset
      : genericAsset
        ? {
            ...genericAsset,
            chainId: asset.chainId,
            network: asset.network,
            address: asset.address,
            mainnetAddress: asset.mainnet_address,
          }
        : asset;
  }, [asset, genericAsset, hasBalance]);

  const { chart, chartType, color, fetchingCharts, updateChartType, initialChartDataLabels, showChart, throttledData } =
    useChartThrottledPoints({
      asset: assetWithPrice,
    });

  return (
    <ChartPathProvider data={throttledData}>
      <Chart
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...initialChartDataLabels}
        updateChartType={updateChartType}
        asset={assetWithPrice}
        chart={chart}
        chartType={chartType}
        color={color}
        fetchingCharts={fetchingCharts}
        nativePoints={chart}
        showChart={showChart}
        throttledData={throttledData}
        isPool={false}
        testID="chart"
      />
    </ChartPathProvider>
  );
});
