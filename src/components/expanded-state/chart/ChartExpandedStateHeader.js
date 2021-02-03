import React, { useEffect, useMemo } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components';
import { useCallbackOne } from 'use-memo-one';
import { CoinIconGroup } from '../../coin-icon';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import ChartContextButton from './ChartContextButton';
import {
  ChartDateLabel,
  ChartHeaderSubtitle,
  ChartPercentChangeLabel,
  ChartPriceLabel,
} from './chart-data-labels';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useBooleanState } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';

const { call, cond, onChange, useCode } = Animated;

const noPriceData = 'No price data';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
  marginTop: android ? -10 : 0,
})`
  ${({ showChart }) => padding(0, 19, showChart ? (android ? 15 : 30) : 0)};
`;

function useTabularNumsWhileScrubbing(isScrubbing) {
  const [tabularNums, enable, disable] = useBooleanState();
  // Only enable tabularNums on the price label when the user is scrubbing
  // because we are obnoxiously into details
  useCode(
    useCallbackOne(
      () =>
        onChange(
          isScrubbing,
          cond(isScrubbing, call([], enable), call([], disable))
        ),
      [disable, enable, isScrubbing]
    )
  );
  return tabularNums;
}

export default function ChartExpandedStateHeader({
  asset,
  changeDirection,
  changeRef,
  color: givenColors,
  dateRef,
  isPool,
  isScrubbing,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  chartTimeSharedValue,
  showChart,
}) {
  const { colors } = useTheme();
  const color = givenColors || colors.dark;
  const tokens = useMemo(() => {
    return isPool ? asset.tokens : [asset];
  }, [asset, isPool]);
  const { nativeCurrency } = useAccountSettings();
  const tabularNums = useTabularNumsWhileScrubbing(isScrubbing);

  const isNoPriceData = latestPrice === noPriceData;

  const price = useMemo(
    () => convertAmountToNativeDisplay(latestPrice, nativeCurrency),
    [latestPrice, nativeCurrency]
  );

  const priceSharedValue = useSharedValue('');

  useEffect(() => {
    if (!isNoPriceData) {
      priceSharedValue.value = price;
    } else {
      priceSharedValue.value = '';
    }
  }, [price, isNoPriceData, priceSharedValue]);

  const title = isPool ? `${asset.tokenNames} Pool` : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  return (
    <Container showChart={showChart}>
      <Row
        align="center"
        justify="space-between"
        testID="expanded-state-header"
      >
        <CoinIconGroup tokens={tokens} />
        <ChartContextButton asset={asset} color={color} />
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
            isScrubbing={isScrubbing}
            priceRef={priceRef}
            priceSharedValue={priceSharedValue}
            tabularNums={tabularNums}
          />
          <ChartPercentChangeLabel
            changeDirection={changeDirection}
            changeRef={changeRef}
            color={
              isNoPriceData ? colors.alpha(colors.blueGreyDark, 0.8) : color
            }
            isScrubbing={isScrubbing}
            latestChange={latestChange}
            tabularNums={tabularNums}
          />
        </RowWithMargins>
        {!isNoPriceData && showChart && !isNaN(latestChange) && (
          <RowWithMargins
            height={30}
            justify="space-between"
            marginHorizontal={1}
            marginVertical={android ? 4 : 1}
          >
            <ChartHeaderSubtitle
              color={
                isNoPriceData ? colors.alpha(colors.blueGreyDark, 0.8) : color
              }
              style={{ flex: 1 }}
              weight={isNoPriceData ? 'semibold' : 'bold'}
            >
              {titleOrNoPriceData}
            </ChartHeaderSubtitle>
            <ChartDateLabel
              chartTimeSharedValue={chartTimeSharedValue}
              dateRef={dateRef}
            />
          </RowWithMargins>
        )}
      </Column>
    </Container>
  );
}
