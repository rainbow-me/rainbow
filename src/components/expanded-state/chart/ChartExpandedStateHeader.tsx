import React, { useEffect, useMemo } from 'react';
import Animated, { useSharedValue } from 'react-native-reanimated';
import styled from 'styled-components';
import { useCallbackOne } from 'use-memo-one';
import { CoinIcon, CoinIconGroup } from '../../coin-icon';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ChartAddToListButton' was resolved to '/... Remove this comment to see the full error message
import ChartAddToListButton from './ChartAddToListButton';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ChartContextButton' was resolved to '/Us... Remove this comment to see the full error message
import ChartContextButton from './ChartContextButton';
import {
  ChartDateLabel,
  ChartHeaderSubtitle,
  ChartPercentChangeLabel,
  ChartPriceLabel,
} from './chart-data-labels';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useBooleanState } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const { call, cond, onChange, useCode } = Animated;

const noPriceData = 'No price data';

const Container = styled(ColumnWithMargins).attrs({
  margin: 12,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  marginTop: android ? -10 : 0,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${({ showChart }) => padding(0, 19, showChart ? (android ? 15 : 30) : 0)};
`;

function useTabularNumsWhileScrubbing(isScrubbing: any) {
  const [tabularNums, enable, disable] = useBooleanState();
  // Only enable tabularNums on the price label when the user is scrubbing
  // because we are obnoxiously into details
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
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
  testID,
  overrideValue = false,
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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

  const showPriceChange = !isNoPriceData && showChart && !isNaN(latestChange);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container showChart={showChart}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row
        align="center"
        justify="space-between"
        testID={
          testID ? `${testID}-expanded-state-header` : 'expanded-state-header'
        }
      >
        {tokens.length === 1 ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CoinIcon badgeXPosition={-7} badgeYPosition={0} {...asset} />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <CoinIconGroup tokens={tokens} />
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartAddToListButton asset={asset} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartContextButton asset={asset} color={color} />
        </Row>
      </Row>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins
          height={30}
          justify="space-between"
          marginHorizontal={1}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ChartPriceLabel
            defaultValue={isNoPriceData ? title : price}
            isNoPriceData={isNoPriceData}
            isPool={isPool}
            isScrubbing={isScrubbing}
            priceRef={priceRef}
            priceSharedValue={priceSharedValue}
            tabularNums={tabularNums}
          />
          {showPriceChange && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ChartPercentChangeLabel
              changeDirection={changeDirection}
              changeRef={changeRef}
              color={
                isNoPriceData ? colors.alpha(colors.blueGreyDark, 0.8) : color
              }
              isScrubbing={isScrubbing}
              latestChange={latestChange}
              overrideValue={overrideValue}
              tabularNums={tabularNums}
            />
          )}
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins
          height={30}
          justify="space-between"
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          marginHorizontal={android ? (isNoPriceData ? -7 : 0) : 1}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          marginVertical={android ? 4 : 1}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
