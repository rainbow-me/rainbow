import { toUpper } from 'lodash';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useRemoveNextToLast } from '../../navigation/useRemoveNextToLast';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import CoinName from '../coin-row/CoinName';
import { initialLiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
import { PoolValue } from './PoolValue';
import { analytics } from '@/analytics';
import { readableUniswapSelector } from '@/helpers/uniswapLiquidityTokenInfoSelector';
import { useAccountSettings, useGenericAsset } from '@/hooks';
import { Navigation, useNavigation } from '@/navigation';
import { parseAssetNative } from '@/parsers';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';

const BottomRowContainer = styled(Row)({
  marginBottom: 10,
  marginTop: -7.75,
});

const TopRowContainer = styled(Row).attrs({
  align: 'flex-start',
  justify: 'flex-start',
})({});

const BottomRow = ({ symbol }) => {
  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText>{toUpper(symbol)}</BottomRowText>
      </FlexItem>
    </BottomRowContainer>
  );
};

const TopRow = item => {
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName>{item.tokenNames}</CoinName>
      </FlexItem>
      <View>
        <PoolValue type={item.attribute} value={item[item.attribute]} />
      </View>
    </TopRowContainer>
  );
};

export default function UniswapPoolListRow({ assetType, item, ...props }) {
  const { push } = useNavigation();
  const removeNextToLastRoute = useRemoveNextToLast();
  const { nativeCurrency } = useAccountSettings();
  const genericPoolAsset = useGenericAsset(item.address);
  const { uniswap } = useSelector(readableUniswapSelector);

  const handleOpenExpandedState = useCallback(() => {
    const isFromWalletScreen = Navigation.getActiveRoute().params
      ?.isFromWalletScreen;
    let poolAsset = uniswap.find(pool => pool.address === item.address);
    if (!poolAsset) {
      poolAsset = parseAssetNative(
        { ...item, ...genericPoolAsset },
        nativeCurrency
      );
    }

    analytics.track('Pressed Pools Item', {
      category: 'discover',
      symbol: poolAsset.tokenNames,
      type: item.attribute,
    });

    // on iOS we handle this on native side
    android && removeNextToLastRoute();

    push(Routes.EXPANDED_ASSET_SHEET_POOLS, {
      asset: poolAsset,
      dpi: true,
      fromDiscover: true,
      isFromWalletScreen,
      longFormHeight: initialLiquidityPoolExpandedStateSheetHeight,
      type: assetType,
    });
  }, [
    assetType,
    genericPoolAsset,
    item,
    nativeCurrency,
    push,
    removeNextToLastRoute,
    uniswap,
  ]);

  return (
    <ButtonPressAnimation onPress={handleOpenExpandedState} scaleTo={0.96}>
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
