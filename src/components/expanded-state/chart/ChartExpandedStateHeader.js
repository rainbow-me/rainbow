import React, { useEffect, useMemo } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useCallbackOne } from 'use-memo-one';
import { CoinIcon } from '../../coin-icon';
import { ColumnWithMargins, Row } from '../../layout';
import ChartContextButton from './ChartContextButton';
import {
  ChartDateLabel,
  ChartHeaderSubtitle,
  ChartPercentChangeLabel,
  ChartPriceLabel,
} from './chart-data-labels';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useBooleanState } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';

const { call, cond, onChange, useCode } = Animated;

const noPriceData = 'No price data';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
})`
  ${padding(0, 19, 24)};
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
  color = colors.dark,
  dateRef,
  isScrubbing,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  chartTimeSharedValue,
}) {
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

  const coinIconShadow = useMemo(
    () => [[0, 4, 12, asset?.shadowColor || color, 0.3]],
    [asset, color]
  );

  return (
    <Container>
      <Row align="center" justify="space-between">
        <CoinIcon
          address={asset?.address}
          shadow={coinIconShadow}
          symbol={asset?.symbol}
        />
        <ChartContextButton asset={asset} color={color} />
      </Row>
      <Row align="center" justify="space-between">
        <ColumnWithMargins align="start" flex={1} margin={1}>
          <ChartPriceLabel
            defaultValue={isNoPriceData ? asset?.name : price}
            isNoPriceData={isNoPriceData}
            isScrubbing={isScrubbing}
            priceRef={priceRef}
            priceSharedValue={priceSharedValue}
            tabularNums={tabularNums}
          />
          <ChartHeaderSubtitle>
            {isNoPriceData ? noPriceData : asset?.name}
          </ChartHeaderSubtitle>
        </ColumnWithMargins>
        {!isNoPriceData && (
          <ColumnWithMargins align="end" margin={1}>
            <ChartPercentChangeLabel
              changeDirection={changeDirection}
              changeRef={changeRef}
              isScrubbing={isScrubbing}
              latestChange={latestChange}
              tabularNums={tabularNums}
            />
            <ChartDateLabel
              chartTimeSharedValue={chartTimeSharedValue}
              dateRef={dateRef}
            />
          </ColumnWithMargins>
        )}
      </Row>
    </Container>
  );
}
