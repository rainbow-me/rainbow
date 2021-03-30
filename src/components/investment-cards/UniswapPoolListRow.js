import { toUpper } from 'lodash';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { UniBalanceHeightDifference } from '../../hooks/charts/useChartThrottledPoints';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import CoinName from '../coin-row/CoinName';
import { initialLiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
import { PoolValue } from './PoolValue';
import { readableUniswapSelector } from '@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector';
import { useAccountSettings } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { parseAssetsNative } from '@rainbow-me/parsers';
import Routes from '@rainbow-me/routes';

const BottomRowContainer = styled(Row)`
  margin-bottom: 10;
  margin-top: -7.75;
`;

const TopRowContainer = styled(Row).attrs({
  align: 'flex-start',
  justify: 'flex-start',
})``;

const PriceContainer = ios
  ? View
  : styled(View)`
      margin-top: -3;
      margin-bottom: 3;
    `;

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
      <PriceContainer>
        <PoolValue type={item.attribute} value={item[item.attribute]} />
      </PriceContainer>
    </TopRowContainer>
  );
};

export default function UniswapPoolListRow({ assetType, item, ...props }) {
  const { navigate } = useNavigation();
  const { nativeCurrency } = useAccountSettings();
  const { genericAssets } = useSelector(({ data: { genericAssets } }) => ({
    genericAssets,
  }));
  const { uniswap } = useSelector(readableUniswapSelector);

  const handleOpenExpandedState = useCallback(() => {
    let inWallet = true;
    let poolAsset = uniswap.find(pool => pool.address === item.address);
    if (!poolAsset) {
      inWallet = false;
      const genericPoolAsset = genericAssets[item.address];
      poolAsset = parseAssetsNative(
        [{ ...item, ...genericPoolAsset }],
        nativeCurrency
      )[0];
    }
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: poolAsset,
      fromDiscover: true,
      longFormHeight: inWallet
        ? initialLiquidityPoolExpandedStateSheetHeight
        : initialLiquidityPoolExpandedStateSheetHeight -
          UniBalanceHeightDifference,
      type: assetType,
    });
  }, [assetType, genericAssets, item, nativeCurrency, navigate, uniswap]);

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
