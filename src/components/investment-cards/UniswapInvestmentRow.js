import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { convertAmountToPercentageDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import BalanceText from '../coin-row/BalanceText';
import CoinName from '../coin-row/CoinName';
import { LiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const formatPercentageString = percentString =>
  percentString
    ? percentString
        .toString()
        .split('-')
        .join('- ')
    : '-';

const PercentageText = styled(BottomRowText).attrs({
  align: 'right',
})`
  ${({ isPositive }) => (isPositive ? `color: ${colors.green};` : null)};
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

const BottomRow = ({ uniBalance, type, relativeChange }) => {
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

const TopRow = ({ name, totalNativeDisplay }) => {
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <PriceContainer>
        <BalanceText numberOfLines={1}>{totalNativeDisplay}</BalanceText>
      </PriceContainer>
    </TopRowContainer>
  );
};

const UniswapInvestmentRow = ({ assetType, item, ...props }) => {
  const { navigate } = useNavigation();

  const handleOpenExpandedState = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: item,
      cornerRadius: 10,
      longFormHeight: LiquidityPoolExpandedStateSheetHeight,
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
};

export default UniswapInvestmentRow;
