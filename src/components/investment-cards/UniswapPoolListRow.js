import { toUpper } from 'lodash';
import React, { Fragment, useCallback } from 'react';
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

const Content = styled(ButtonPressAnimation)`
  top: 0;
`;

const BottomRowContainer = ios
  ? Fragment
  : styled(Row).attrs({ marginBottom: 10, marginTop: -10 })``;

const TopRowContainer = ios
  ? Fragment
  : styled(Row).attrs({
      align: 'flex-start',
      justify: 'flex-start',
      marginTop: 0,
    })``;

const PriceContainer = ios
  ? View
  : styled(View)`
      margin-top: -3;
      margin-bottom: 3;
    `;

const PoolValueWrapper = styled(Row)`
  border-radius: 12px;
  height: 30px;
  padding-horizontal: 8px;
  padding-top: ${ios ? 3 : 2}px;
`;

const PoolValueText = styled(Text).attrs({
  lineHeight: 'paragraphSmall',
  size: 'lmedium',
  weight: 'bold',
})``;

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
    )} m`;
  } else {
    ret = convertAmountToNativeDisplay(num.toString(), nativeCurrency);
    num.toFixed(2);
  }

  return ret;
};

const renderPoolValue = (type, value, nativeCurrency, colors) => {
  let formattedValue = value;
  let color = colors.appleBlue;

  if (type === 'anualized_fees' || type === 'profit30d') {
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
        <CoinName color={colors.dark}>{item.tokenNames}</CoinName>
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
    <Content onPress={handleOpenExpandedState} scaleTo={0.96}>
      <CoinRow
        bottomRowRender={BottomRow}
        isPool
        onPress={handleOpenExpandedState}
        topRowRender={TopRow}
        {...item}
        {...props}
      />
    </Content>
  );
}
