import lang from 'i18n-js';
import { invert } from 'lodash';
import React, { useMemo } from 'react';
import { CoinIcon, CoinIconGroup } from '../../coin-icon';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import ChartAddToListButton from './ChartAddToListButton';
import ChartContextButton from './ChartContextButton';
import {
  ChartDateLabel,
  ChartHeaderSubtitle,
  ChartPercentChangeLabel,
  ChartPriceLabel,
} from './chart-data-labels';
import { useChartData } from '@rainbow-me/animated-charts';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { useAccountSettings } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const noPriceData = lang.t('expanded_state.chart.no_price_data');

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
  marginTop: android ? -10 : 0,
})(({ showChart }) => ({
  ...padding.object(0, 19, showChart ? (android ? 15 : 30) : 0),
}));

export default function ChartExpandedStateHeader({
  asset,
  changeDirection,
  changeRef,
  color: givenColors,
  dateRef,
  isPool,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  showChart,
  testID,
  overrideValue = false,
  chartType,
}) {
  const { colors } = useTheme();
  const color = givenColors || colors.dark;
  const tokens = useMemo(() => {
    return isPool ? asset.tokens : [asset];
  }, [asset, isPool]);
  const { nativeCurrency } = useAccountSettings();

  const isNoPriceData = latestPrice === noPriceData;

  const title = isPool
    ? lang.t('expanded_state.chart.token_pool', {
        tokenName: asset.tokenNames,
      })
    : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  const showPriceChange = !isNoPriceData && showChart && !isNaN(latestChange);

  const timespan = invert(ChartTypes)[chartType];

  const formattedTimespan =
    timespan.charAt(0).toUpperCase() + timespan.slice(1);

  const { data } = useChartData();

  const defaultTimeValue = useMemo(() => {
    if (chartType === ChartTypes.day) {
      return 'Today';
    } else if (chartType === ChartTypes.max) {
      return 'All Time';
    } else {
      return `Past ${formattedTimespan}`;
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

  const defaultPriceValue = isNoPriceData ? '' : price;

  const ratio = useMemo(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;

    return firstValue === Number(firstValue) ? lastValue / firstValue : 1;
  }, [data]);

  return (
    <Container showChart={showChart}>
      <Row
        align="center"
        justify="space-between"
        testID={
          testID ? `${testID}-expanded-state-header` : 'expanded-state-header'
        }
      >
        {tokens.length === 1 ? (
          <CoinIcon badgeXPosition={-7} badgeYPosition={0} {...asset} />
        ) : (
          <CoinIconGroup tokens={tokens} />
        )}

        <Row>
          <ChartAddToListButton asset={asset} />
          <ChartContextButton asset={asset} color={color} />
        </Row>
      </Row>
      <Column>
        <RowWithMargins
          height={30}
          justify="space-between"
          marginHorizontal={1}
        >
          <ChartPriceLabel
            defaultValue={isNoPriceData ? title : price}
            isNoPriceData={isNoPriceData}
            isPool={isPool}
            priceRef={priceRef}
            priceValue={defaultPriceValue}
            ratio={ratio}
          />
          {showPriceChange && (
            <ChartPercentChangeLabel
              changeDirection={changeDirection}
              changeRef={changeRef}
              color={
                isNoPriceData ? colors.alpha(colors.blueGreyDark, 0.8) : color
              }
              latestChange={latestChange}
              overrideValue={overrideValue}
              ratio={ratio}
            />
          )}
        </RowWithMargins>

        <RowWithMargins
          height={30}
          justify="space-between"
          marginHorizontal={android ? (isNoPriceData ? -7 : 0) : 1}
          marginVertical={android ? 4 : 1}
        >
          <ChartHeaderSubtitle
            color={
              isNoPriceData ? colors.alpha(colors.blueGreyDark, 0.8) : color
            }
            testID={`chart-header-${titleOrNoPriceData}`}
            weight={isNoPriceData ? 'semibold' : 'bold'}
          >
            {titleOrNoPriceData}
          </ChartHeaderSubtitle>
          {showPriceChange && (
            <ChartDateLabel
              chartTimeDefaultValue={defaultTimeValue}
              dateRef={dateRef}
              ratio={ratio}
            />
          )}
        </RowWithMargins>
      </Column>
    </Container>
  );
}
