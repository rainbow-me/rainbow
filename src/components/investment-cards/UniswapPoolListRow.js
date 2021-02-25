import { toUpper } from 'lodash';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import CoinName from '../coin-row/CoinName';
import { initialLiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
import { Text } from '../text';
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

const PoolValueWrapper = styled(Row)`
  border-radius: 15px;
  height: 30px;
  padding-horizontal: 9px;
  padding-top: 2px;
`;

const PoolValueText = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedTight',
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
  weight: 'bold',
})`
  ${android && 'padding-top: 3px'}
`;

const bigNumberFormat = (num, nativeCurrency) => {
  let ret;
  if (num > 1000000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000000).toString(),
      nativeCurrency
    )} b`;
  } else if (num > 1000000) {
    ret = `${convertAmountToNativeDisplay(
      (num / 1000000).toString(),
      nativeCurrency
    )}m`;
  } else {
    ret = convertAmountToNativeDisplay(num.toString(), nativeCurrency);
    num.toFixed(2);
  }

  return ret;
};

const renderPoolValue = (type, value, nativeCurrency, colors) => {
  let formattedValue = value;
  let color = colors.appleBlue;

  if (type === 'annualized_fees' || type === 'profit30d') {
    let percent = parseFloat(value);
    if (!percent || percent === 0) {
      formattedValue = '0%';
    }

    if (percent < 0.0001 && percent > 0) {
      formattedValue = '< 0.0001%';
    }

    if (percent < 0 && percent > -0.0001) {
      formattedValue = '< 0.0001%';
    }

    let fixedPercent = percent.toFixed(2);
    if (fixedPercent === '0.00') {
      formattedValue = '0%';
    }
    if (fixedPercent > 0) {
      color = colors.green;
      if (fixedPercent > 100) {
        formattedValue = `+${percent?.toFixed(0).toLocaleString()}%`;
      } else {
        formattedValue = `+${fixedPercent}%`;
      }
    } else {
      formattedValue = `${fixedPercent}%`;
      color = colors.red;
    }
  } else if (type === 'liquidity' || type === 'oneDayVolumeUSD') {
    formattedValue = bigNumberFormat(value, nativeCurrency);
  }
  return (
    <PoolValueWrapper backgroundColor={colors.alpha(color, 0.06)}>
      <PoolValueText color={color}>{formattedValue}</PoolValueText>
    </PoolValueWrapper>
  );
};

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
  const { colors } = useTheme();
  const { nativeCurrency } = useAccountSettings();
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName>{item.tokenNames}</CoinName>
      </FlexItem>
      <PriceContainer>
        {renderPoolValue(
          item.attribute,
          item[item.attribute],
          nativeCurrency,
          colors
        )}
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
    let poolAsset = uniswap.find(pool => pool.address === item.address);
    if (!poolAsset) {
      const genericPoolAsset = genericAssets[item.address];
      poolAsset = parseAssetsNative(
        [{ ...item, ...genericPoolAsset }],
        nativeCurrency
      )[0];
    }
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: poolAsset,
      fromDiscover: true,
      longFormHeight: initialLiquidityPoolExpandedStateSheetHeight,
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
