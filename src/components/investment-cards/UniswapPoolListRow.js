import { toUpper } from 'lodash';
import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import CoinName from '../coin-row/CoinName';
import { initialLiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { FlexItem, Row } from '../layout';
import { Text } from '../text';
import { useNavigation } from '@rainbow-me/navigation';
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

const PoolValue = styled(Row)`
  background-color: ${({ theme: { colors } }) =>
    `${colors.alpha(colors.appleBlue, 0.06)}`};
  border-radius: 12px;
  height: 30px;
  padding-horizontal: 8px;
  padding-top: ${ios ? 3 : 2}px;
`;

const formatAttribute = (type, value) => {
  if (type === 'anualized_fees') {
    return `$${value}`;
  }
  return value;
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
  return (
    <TopRowContainer>
      <FlexItem flex={1}>
        <CoinName color={colors.dark}>{item.tokenNames}</CoinName>
      </FlexItem>
      <PriceContainer>
        <PoolValue>
          <Text
            color={colors.appleBlue}
            lineHeight="paragraphSmall"
            size="lmedium"
            weight="bold"
          >
            {formatAttribute(item.attribute, item[item.attribute])}
          </Text>
        </PoolValue>
      </PriceContainer>
    </TopRowContainer>
  );
};

export default function UniswapPoolListRow({ assetType, item, ...props }) {
  const { navigate } = useNavigation();

  const handleOpenExpandedState = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: item,
      cornerRadius: 10,
      longFormHeight: initialLiquidityPoolExpandedStateSheetHeight,
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
