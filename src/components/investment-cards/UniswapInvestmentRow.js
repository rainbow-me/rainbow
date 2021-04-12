import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { convertAmountToPercentageDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import BalanceText from '../coin-row/BalanceText';
import CoinName from '../coin-row/CoinName';
import { FlexItem, Row } from '../layout';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const formatPercentageString = percentString =>
  percentString ? percentString.toString().split('-').join('- ') : '-';

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  color: ${({ isPositive, theme: { colors } }) =>
    isPositive ? colors.green : colors.alpha(colors.blueGreyDark, 0.5)};
`;

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

const BottomRow = ({ price, type, uniBalance }) => {
  const relativeChange = price?.relative_change_24h;
  const percentageChangeDisplay = relativeChange
    ? formatPercentageString(convertAmountToPercentageDisplay(relativeChange))
    : '-';
  const isPositive =
    relativeChange && percentageChangeDisplay.charAt(0) !== '-';

  const tokenType = type === 'uniswap' ? 'UNI-V1' : 'UNI-V2';
  const balanceLabel = `${uniBalance} ${tokenType}`;

  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText>{balanceLabel}</BottomRowText>
      </FlexItem>
      <View>
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </BottomRowContainer>
  );
};

const TopRow = ({ tokenNames, totalNativeDisplay }) => {
  const { colors } = useTheme();
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName color={colors.dark}>{tokenNames}</CoinName>
      </FlexItem>
      <PriceContainer>
        <BalanceText color={colors.blueGreyLight} numberOfLines={1}>
          {totalNativeDisplay}
        </BalanceText>
      </PriceContainer>
    </TopRowContainer>
  );
};

export default function UniswapInvestmentRow({ assetType, item, ...props }) {
  const { navigate } = useNavigation();

  const handleOpenExpandedState = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_POOLS, {
      asset: item,
      cornerRadius: 39,
      type: assetType,
    });
  }, [assetType, item, navigate]);

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
