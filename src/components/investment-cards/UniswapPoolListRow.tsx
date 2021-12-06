import analytics from '@segment/analytics-react-native';
import { toUpper } from 'lodash';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useRemoveNextToLast } from '../../navigation/useRemoveNextToLast';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import CoinName from '../coin-row/CoinName';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/LiquidityPoolExpandedSta... Remove this comment to see the full error message
import { initialLiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './PoolValue' was resolved to '/Users/nickb... Remove this comment to see the full error message
import { PoolValue } from './PoolValue';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/uniswapLiq... Remove this comment to see the full error message
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseAssetsNative } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const BottomRowContainer = styled(Row)`
  margin-bottom: 10;
  margin-top: -7.75;
`;

const TopRowContainer = styled(Row).attrs({
  align: 'flex-start',
  justify: 'flex-start',
})``;

const BottomRow = ({ symbol }: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <BottomRowContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FlexItem flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BottomRowText>{toUpper(symbol)}</BottomRowText>
      </FlexItem>
    </BottomRowContainer>
  );
};

const TopRow = (item: any) => {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TopRowContainer>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FlexItem flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CoinName>{item.tokenNames}</CoinName>
      </FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <PoolValue type={item.attribute} value={item[item.attribute]} />
      </View>
    </TopRowContainer>
  );
};

export default function UniswapPoolListRow({ assetType, item, ...props }: any) {
  const { push } = useNavigation();
  const removeNextToLastRoute = useRemoveNextToLast();
  const { nativeCurrency } = useAccountSettings();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniswap' does not exist on type 'unknown... Remove this comment to see the full error message
  const { uniswap } = useSelector(readableUniswapSelector);

  const handleOpenExpandedState = useCallback(() => {
    let poolAsset = uniswap.find((pool: any) => pool.address === item.address);
    if (!poolAsset) {
      const genericPoolAsset = genericAssets[item.address];
      poolAsset = parseAssetsNative(
        [{ ...item, ...genericPoolAsset }],
        nativeCurrency
      )[0];
    }

    analytics.track('Pressed Pools Item', {
      category: 'discover',
      symbol: poolAsset.tokenNames,
      type: item.attribute,
    });

    // on iOS we handle this on native side
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && removeNextToLastRoute();

    push(Routes.EXPANDED_ASSET_SHEET_POOLS, {
      asset: poolAsset,
      dpi: true,
      fromDiscover: true,
      longFormHeight: initialLiquidityPoolExpandedStateSheetHeight,
      type: assetType,
    });
  }, [
    assetType,
    genericAssets,
    item,
    nativeCurrency,
    push,
    removeNextToLastRoute,
    uniswap,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation onPress={handleOpenExpandedState} scaleTo={0.96}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CoinRow
        bottomRowRender={BottomRow}
        isPool
        onPress={handleOpenExpandedState}
        topRowRender={TopRow}
        {...item}
        {...props}
      />
    </ButtonPressAnimation>
  );
}
