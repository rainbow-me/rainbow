import React, { memo, useMemo } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const ChartSection = memo(function ChartSection() {
  // const { assetWithPrice, throttledData, showChart, chart, chartType, color, fetchingCharts } = useExpandedAssetSheetContext();
  const { asset } = useExpandedAssetSheetContext();

  const { nativeCurrency, chainId: currentChainId } = useAccountSettings();

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
            // mainnetAddress: asset?.networks?.[useBackendNetworksStore.getState().getChainsName()[ChainId.mainnet]]?.address,
            mainnetAddress: asset.mainnet_address,
          }
        : asset;
  }, [asset, genericAsset, hasBalance]);

  const { chart, chartType, color, fetchingCharts, updateChartType, initialChartDataLabels, showChart, throttledData } =
    useChartThrottledPoints({
      asset: assetWithPrice,
      // heightWithChart: Math.min(
      //   carouselHeight +
      //     heightWithChart -
      //     (!hasBalance && 68) +
      //     additionalContentHeight +
      //     (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
      //   screenHeight
      // ),
      // heightWithoutChart: Math.min(
      //   carouselHeight +
      //     heightWithoutChart -
      //     (!hasBalance && 68) +
      //     additionalContentHeight +
      //     (additionalContentHeight === 0 ? 0 : scrollableContentHeight),
      //   screenHeight
      // ),
      // shortHeightWithChart: Math.min(carouselHeight + heightWithChart - (!hasBalance && 68), screenHeight),
      // shortHeightWithoutChart: Math.min(carouselHeight + heightWithoutChart - (!hasBalance && 68), screenHeight),
    });

  return (
    <ChartPathProvider data={throttledData}>
      <Chart
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
