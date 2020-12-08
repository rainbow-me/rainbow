import { map } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useCallbackOne } from 'use-memo-one';
import { useColorForAssets } from '../../../hooks/useColorForAsset';
import { CoinIcon } from '../../coin-icon';
import { ColumnWithMargins, Row, RowWithMargins } from '../../layout';
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
  ${({ showChart }) => padding(0, 19, showChart ? 30 : 0)};
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
  isPool,
  isScrubbing,
  latestChange,
  latestPrice = noPriceData,
  priceRef,
  chartTimeSharedValue,
  showChart,
}) {
  const tokens = useMemo(() => {
    return isPool ? asset.tokens : [asset];
  }, [asset, isPool]);
  const { nativeCurrency } = useAccountSettings();
  const tabularNums = useTabularNumsWhileScrubbing(isScrubbing);
  const colors = useColorForAssets(tokens);

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

  const shadows = useMemo(
    () =>
      map(tokens, (asset, index) => {
        return [
          [0, 4, 12, asset.shadowColor || asset.color || colors[index], 0.3],
        ];
      }),
    [tokens, colors]
  );

  const title = isPool ? `${asset.tokenNames} Pool` : asset?.name;

  const titleOrNoPriceData = isNoPriceData ? noPriceData : title;

  return (
    <Container showChart={showChart}>
      <Row
        align="center"
        justify="space-between"
        testID="expanded-state-header"
      >
        <Row>
          {map(tokens, (token, index) => {
            return (
              <View key={`coinicon-${index}`} zIndex={-index}>
                <CoinIcon
                  address={token.address}
                  marginRight={-10}
                  position="relative"
                  shadow={shadows[index]}
                  symbol={token.symbol}
                />
              </View>
            );
          })}
        </Row>
        <ChartContextButton asset={asset} color={color} />
      </Row>
      <RowWithMargins
        align={ios ? 'center' : 'flex-start'}
        justify="space-between"
        margin={12}
      >
        <ColumnWithMargins align="start" flex={1} margin={1}>
          <ChartPriceLabel
            defaultValue={isNoPriceData ? title : price}
            isNoPriceData={isNoPriceData}
            isPool={isPool}
            isScrubbing={isScrubbing}
            priceRef={priceRef}
            priceSharedValue={priceSharedValue}
            tabularNums={tabularNums}
          />
          <ChartHeaderSubtitle>{titleOrNoPriceData}</ChartHeaderSubtitle>
        </ColumnWithMargins>
        {!isNoPriceData && showChart && !isNaN(latestChange) && (
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
      </RowWithMargins>
    </Container>
  );
}
