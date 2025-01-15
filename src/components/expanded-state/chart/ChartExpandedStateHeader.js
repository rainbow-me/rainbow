import lang from 'i18n-js';
import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Stack, Text, TextShadow, Bleed } from '@/design-system';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { useChartData } from '@/react-native-animated-charts/src';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ColumnWithMargins } from '../../layout';
import { ChartPercentChangeLabel, ChartPriceLabel } from './chart-data-labels';

const noPriceData = lang.t('expanded_state.chart.no_price_data');

const Container = styled(ColumnWithMargins).attrs({
  margin: 20,
})(({ showChart }) => ({
  ...padding.object(0, 19, showChart ? 36 : 0),
}));

export default function ChartExpandedStateHeader({
  asset,
  color: givenColors,
  isPool,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  showChart,
  testID,
}) {
  const theme = useTheme();
  const color = givenColors || theme.colors.dark;
  const { nativeCurrency } = useAccountSettings();

  const isNoPriceData = latestPrice === noPriceData;

  const title = isPool
    ? lang.t('expanded_state.chart.token_pool', {
        tokenName: asset.tokenNames,
      })
    : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  const { data } = useChartData();

  const price = useMemo(
    () => convertAmountToNativeDisplay(latestPrice, nativeCurrency),
    // we need to make sure we recreate this value only when chart's data change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, latestPrice, nativeCurrency]
  );

  const ratio = useMemo(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;

    return firstValue === Number(firstValue) ? lastValue / firstValue : undefined;
  }, [data]);

  const showPriceChangeStyle = useAnimatedStyle(() => {
    const showPriceChange = !isNoPriceData && showChart && !isNaN(latestChange.value);
    return {
      display: showPriceChange ? 'flex' : 'none',
      opacity: withTiming(showPriceChange ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  return (
    <Container testID={testID ? `${testID}-expanded-state-header` : 'expanded-state-header'} showChart={showChart}>
      <Stack space={'20px'}>
        <RainbowCoinIcon
          size={44}
          icon={asset?.icon_url}
          chainId={asset?.chainId}
          symbol={asset?.symbol}
          theme={theme}
          colors={asset?.colors}
        />
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text
            color={{ custom: isNoPriceData ? theme.colors.alpha(theme.colors.blueGreyDark, 0.8) : color }}
            numberOfLines={1}
            size="22pt"
            testID={`chart-header-${titleOrNoPriceData}`}
            weight={isNoPriceData ? 'semibold' : 'bold'}
          >
            {titleOrNoPriceData}
          </Text>
        </TextShadow>
        <ChartPriceLabel defaultValue={title} isNoPriceData={isNoPriceData} isPool={isPool} priceRef={priceRef} priceValue={price} />
        <Animated.View style={showPriceChangeStyle}>
          <Bleed top={'6px'}>
            <ChartPercentChangeLabel latestChange={latestChange} ratio={ratio} />
          </Bleed>
        </Animated.View>
      </Stack>
    </Container>
  );
}
