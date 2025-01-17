import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { Column, Columns, Text } from '@/design-system';
import ChartTypes from '@/helpers/chartTypes';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { useChartData } from '@/react-native-animated-charts/src';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ColumnWithMargins, Row } from '../../layout';
import ChartContextButton from './ChartContextButton';
import { ChartDateLabel, ChartPercentChangeLabel, ChartPriceLabel } from './chart-data-labels';

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

  const invertedChartTypes = Object.entries(ChartTypes).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
  const timespan = invertedChartTypes[chartType];

  const formattedTimespan = timespan.charAt(0).toUpperCase() + timespan.slice(1);

  const { data } = useChartData();

  const defaultTimeValue = useMemo(() => {
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
    <Container showChart={showChart}>
      <Row align="center" justify="space-between" testID={testID ? `${testID}-expanded-state-header` : 'expanded-state-header'}>
        <RainbowCoinIcon
          chainId={asset?.chainId}
          color={asset?.colors?.primary || asset?.colors?.fallback || undefined}
          icon={asset?.icon_url}
          symbol={asset?.symbol}
        />
        <ChartContextButton asset={asset} color={color} />
      </Row>

      <View style={{ justifyContent: 'space-between', gap: 12, height: 42 }}>
        <Columns alignHorizontal="justify" alignVertical="center" space="10px">
          <Column>
            <ChartPriceLabel defaultValue={title} isNoPriceData={isNoPriceData} isPool={isPool} priceRef={priceRef} priceValue={price} />
          </Column>
          <Column>
            <Animated.View entering={FadeIn.duration(140)} style={showPriceChangeStyle}>
              <ChartPercentChangeLabel latestChange={latestChange} ratio={ratio} />
            </Animated.View>
          </Column>
        </Columns>

        <Columns alignHorizontal="justify" alignVertical="center" space="10px">
          <Column>
            <Text
              color={{ custom: isNoPriceData ? theme.colors.alpha(theme.colors.blueGreyDark, 0.8) : color }}
              numberOfLines={1}
              size="20pt"
              testID={`chart-header-${titleOrNoPriceData}`}
              weight={isNoPriceData ? 'semibold' : 'bold'}
            >
              {titleOrNoPriceData}
            </Text>
          </Column>
          <Column width="content">
            <Animated.View entering={FadeIn.duration(140)} style={showPriceChangeStyle}>
              <ChartDateLabel chartTimeDefaultValue={defaultTimeValue} ratio={ratio} showPriceChangeStyle={showPriceChangeStyle} />
            </Animated.View>
          </Column>
        </Columns>
      </View>
    </Container>
  );
}
