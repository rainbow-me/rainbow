import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import BalanceText from '../coin-row/BalanceText';
import CoinName from '../coin-row/CoinName';
import { LiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem } from '../layout';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const UniswapInvestmentCardHeight = 114;

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

const BottomRow = ({ pricePerShare, native }) => {
  const percentChange = get(native, 'change');
  const percentageChangeDisplay = formatPercentageString(percentChange);

  const isPositive = percentChange && percentageChangeDisplay.charAt(0) !== '-';

  return (
    <Fragment>
      <FlexItem flex={1}>
        <BottomRowText>{pricePerShare}</BottomRowText>
      </FlexItem>
      <View>
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </Fragment>
  );
};

const TopRow = ({ tokenName, totalNativeDisplay }) => {
  return (
    <Fragment>
      <FlexItem flex={1}>
        <CoinName>{tokenName}</CoinName>
      </FlexItem>
      <View>
        <BalanceText numberOfLines={1}>{totalNativeDisplay}</BalanceText>
      </View>
    </Fragment>
  );
};

const UniswapInvestmentCard = ({ assetType, item, ...props }) => {
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
          { tokenSymbol: 'DAI' },
          { tokenSymbol: 'ETH' },
          { tokenSymbol: 'ANT' },
          { tokenSymbol: 'MKR' },
          { tokenSymbol: 'MANA' },
          { tokenSymbol: 'BLT' },
          { tokenSymbol: 'NEXO' },
          { tokenSymbol: 'PNK' },
        ]}
        topRowRender={TopRow}
        {...item}
        {...props}
      />
    </Content>
  );
};

UniswapInvestmentCard.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

UniswapInvestmentCard.height = UniswapInvestmentCardHeight;

export default UniswapInvestmentCard;
