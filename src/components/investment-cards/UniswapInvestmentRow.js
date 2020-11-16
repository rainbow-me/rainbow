import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
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
  percentString ? percentString.split('-').join('- ') : '-';

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

const BottomRow = ({ pricePerShare, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <BottomRowContainer>
      <FlexItem flex={1}>
        <BottomRowText>{pricePerShare}</BottomRowText>
      </FlexItem>
      <View>
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </BottomRowContainer>
  );
};

const TopRow = ({ tokenSymbol, totalNativeDisplay }) => {
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        {/* // TODO Remove hardcoded ETH */}
        <CoinName>{tokenSymbol}-ETH</CoinName>
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
        tokenSymbols={[
          { tokenSymbol: item.tokenSymbol },
          { tokenSymbol: 'ETH' },
        ]}
        topRowRender={TopRow}
        {...item}
        {...props}
      />
    </Content>
  );
};

UniswapInvestmentRow.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

export default UniswapInvestmentRow;
