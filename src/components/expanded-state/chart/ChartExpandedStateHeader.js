import lang from 'i18n-js';
import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Stack, Text, TextShadow, Bleed, Box } from '@/design-system';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { useChartData } from '@/react-native-animated-charts/src';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ColumnWithMargins } from '../../layout';
import { ChartPercentChangeLabel, ChartPriceLabel, ChartDateLabel } from './chart-data-labels';
import ChartTypes from '@/helpers/chartTypes';

const noPriceData = lang.t('expanded_state.chart.no_price_data');

const Container = styled(ColumnWithMargins).attrs({
  margin: 20,
})(({ showChart }) => ({
  ...padding.object(0, 24, showChart ? 36 : 0),
}));

export default function ChartExpandedStateHeader({
  asset,
  color: givenColors,
  isPool,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  showChart,
  chartType,
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

  const chartDataExists = useMemo(() => {
    const firstValue = data?.points?.[0]?.y;
    return firstValue === Number(firstValue) && !!firstValue;
  }, [data]);

  const chartTimeDefaultValue = useMemo(() => {
    const invertedChartTypes = Object.entries(ChartTypes).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});
    const timespan = invertedChartTypes[chartType];

    const formattedTimespan = timespan.charAt(0).toUpperCase() + timespan.slice(1);
    if (chartType === ChartTypes.day) {
      return lang.t('expanded_state.chart.today');
    } else if (chartType === ChartTypes.max) {
      return lang.t('expanded_state.chart.all_time');
    } else {
      return lang.t('expanded_state.chart.past_timespan', {
        formattedTimespan,
      });
    }
    // we need to make sure we recreate this value only when chart's data change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const price = useMemo(
    () => convertAmountToNativeDisplay(latestPrice, nativeCurrency),
    // we need to make sure we recreate this value only when chart's data change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, latestPrice, nativeCurrency]
  );

  const showPriceChangeStyle = useAnimatedStyle(() => {
    const showPriceChange = !isNoPriceData && chartDataExists && showChart && !isNaN(latestChange.value);
    return {
      opacity: withTiming(showPriceChange ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  return (
    <Container testID={'expanded-state-header'} showChart={showChart}>
      <Stack space={'20px'}>
        <RainbowCoinIcon
          chainSize={20}
          size={44}
          icon={asset?.iconUrl}
          chainId={asset?.chainId}
          color={asset?.colors?.primary || asset?.colors?.fallback || undefined}
          symbol={asset?.symbol}
        />
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text
            color={{ custom: isNoPriceData ? theme.colors.alpha(theme.colors.blueGreyDark, 0.8) : color }}
            numberOfLines={2}
            size="22pt"
            testID={`chart-header-${titleOrNoPriceData}`}
            weight={isNoPriceData ? 'bold' : 'heavy'}
          >
            {titleOrNoPriceData}
          </Text>
        </TextShadow>
        <ChartPriceLabel defaultValue={title} isNoPriceData={isNoPriceData} isPool={isPool} priceRef={priceRef} priceValue={price} />
        <Animated.View style={showPriceChangeStyle}>
          <Bleed top={'6px'}>
            <Box gap={8} flexDirection="row" alignItems="center">
              <ChartPercentChangeLabel latestChange={latestChange} />
              <ChartDateLabel chartTimeDefaultValue={chartTimeDefaultValue} />
            </Box>
          </Bleed>
        </Animated.View>
      </Stack>
    </Container>
  );
}
