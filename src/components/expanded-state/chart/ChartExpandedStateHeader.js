import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import ChartContextButton from './ChartContextButton';
import { ChartDateLabel, ChartHeaderSubtitle, ChartPercentChangeLabel, ChartPriceLabel } from './chart-data-labels';
import { useChartData } from '@/react-native-animated-charts/src';
import ChartTypes from '@/helpers/chartTypes';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings, useBooleanState } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';

const noPriceData = lang.t('expanded_state.chart.no_price_data');

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
  marginTop: android ? -10 : 0,
})(({ showChart }) => ({
  ...padding.object(0, 19, showChart ? (android ? 15 : 30) : 0),
}));

function useTabularNumsWhileScrubbing() {
  const [tabularNums, enable, disable] = useBooleanState();
  // Only enable tabularNums on the price label when the user is scrubbing
  // because we are obnoxiously into details
  const { isActive } = useChartData();

  useAnimatedReaction(
    () => isActive.value,
    useTabularNums => {
      runOnJS(useTabularNums ? enable : disable)();
    }
  );

  return tabularNums;
}

export default function ChartExpandedStateHeader({
  asset,
  color: givenColors,
  dateRef,
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
  const tokens = useMemo(() => {
    return isPool ? asset.tokens : [asset];
  }, [asset, isPool]);
  const { nativeCurrency } = useAccountSettings();
  const tabularNums = useTabularNumsWhileScrubbing();

  const isNoPriceData = latestPrice === noPriceData;

  const title = isPool
    ? lang.t('expanded_state.chart.token_pool', {
        tokenName: asset.tokenNames,
      })
    : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  const showPriceChange = !isNoPriceData && showChart && !isNaN(latestChange);

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

    return firstValue === Number(firstValue) ? lastValue / firstValue : 1;
  }, [data]);

  return (
    <Container showChart={showChart}>
      <Row align="center" justify="space-between" testID={testID ? `${testID}-expanded-state-header` : 'expanded-state-header'}>
        <RainbowCoinIcon
          size={40}
          icon={asset?.icon_url}
          network={asset?.network}
          symbol={asset?.symbol}
          theme={theme}
          colors={asset?.colors}
        />

        <ChartContextButton asset={asset} color={color} />
      </Row>
      <Column>
        <RowWithMargins height={30} justify="space-between" marginHorizontal={1}>
          <ChartPriceLabel
            defaultValue={title}
            isNoPriceData={isNoPriceData}
            isPool={isPool}
            priceRef={priceRef}
            priceValue={price}
            tabularNums={tabularNums}
          />
          {showPriceChange && <ChartPercentChangeLabel latestChange={latestChange} ratio={ratio} />}
        </RowWithMargins>

        <RowWithMargins
          height={30}
          justify="space-between"
          marginHorizontal={android ? (isNoPriceData ? -7 : 0) : 1}
          marginVertical={android ? 4 : 1}
        >
          <ChartHeaderSubtitle
            color={isNoPriceData ? theme.colors.alpha(theme.colors.blueGreyDark, 0.8) : color}
            testID={`chart-header-${titleOrNoPriceData}`}
            weight={isNoPriceData ? 'semibold' : 'bold'}
          >
            {titleOrNoPriceData}
          </ChartHeaderSubtitle>
          {showPriceChange && <ChartDateLabel chartTimeDefaultValue={defaultTimeValue} dateRef={dateRef} ratio={ratio} />}
        </RowWithMargins>
      </Column>
    </Container>
  );
}
