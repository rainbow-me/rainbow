import React, { useEffect, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
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
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { useAccountSettings } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const noPriceData = 'No price data';

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
  chartTimeSharedValue,
  showChart,
  testID,
  overrideValue = false,
}) {
  const { colors } = useTheme();
  const color = givenColors || colors.dark;
  const tokens = useMemo(() => {
    return isPool ? asset.tokens : [asset];
  }, [asset, isPool]);
  const { nativeCurrency } = useAccountSettings();

  const isNoPriceData = latestPrice === noPriceData;

  const price = useMemo(
    () => convertAmountToNativeDisplay(latestPrice, nativeCurrency),
    [latestPrice, nativeCurrency]
  );

  const priceSharedValue = useSharedValue('');

  // TODO (terry): Try to use useImmediateEffect here
  useEffect(() => {
    if (isNoPriceData) {
      priceSharedValue.value = '';
    } else {
      priceSharedValue.value = price;
    }
  }, [price, isNoPriceData, priceSharedValue]);

  const title = isPool ? `${asset.tokenNames} Pool` : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  const showPriceChange = !isNoPriceData && showChart && !isNaN(latestChange);

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
            priceSharedValue={priceSharedValue}
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
              chartTimeSharedValue={chartTimeSharedValue}
              dateRef={dateRef}
            />
          )}
        </RowWithMargins>
      </Column>
    </Container>
  );
}
