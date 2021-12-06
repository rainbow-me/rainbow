import React, { Fragment, useCallback } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { convertAmountToPercentageDisplay } from '../../helpers/utilities';
import { ButtonPressAnimation } from '../animations';
import { BottomRowText, CoinRow } from '../coin-row';
import BalanceText from '../coin-row/BalanceText';
import CoinName from '../coin-row/CoinName';
import { FlexItem, Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

const formatPercentageString = (percentString: any) =>
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

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const BottomRowContainer = ios
  ? Fragment
  : styled(Row).attrs({ marginBottom: 10, marginTop: -10 })``;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const TopRowContainer = ios
  ? Fragment
  : styled(Row).attrs({
      align: 'flex-start',
      justify: 'flex-start',
      marginTop: 0,
    })``;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const PriceContainer = ios
  ? View
  : styled(View)`
      margin-top: -3;
      margin-bottom: 3;
    `;

const BottomRow = ({ price, type, uniBalance }: any) => {
  const relativeChange = price?.relative_change_24h;
  const percentageChangeDisplay = relativeChange
    ? formatPercentageString(convertAmountToPercentageDisplay(relativeChange))
    : '-';
  const isPositive =
    relativeChange && percentageChangeDisplay.charAt(0) !== '-';

  const tokenType = type === 'uniswap' ? 'UNI-V1' : 'UNI-V2';
  const balanceLabel = `${uniBalance} ${tokenType}`;

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
        <BottomRowText>{balanceLabel}</BottomRowText>
      </FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <PercentageText isPositive={isPositive}>
          {percentageChangeDisplay}
        </PercentageText>
      </View>
    </BottomRowContainer>
  );
};

const TopRow = ({ tokenNames, totalNativeDisplay }: any) => {
  const { colors } = useTheme();
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
        <CoinName color={colors.dark}>{tokenNames}</CoinName>
      </FlexItem>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PriceContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BalanceText color={colors.blueGreyLight} numberOfLines={1}>
          {totalNativeDisplay}
        </BalanceText>
      </PriceContainer>
    </TopRowContainer>
  );
};

export default function UniswapInvestmentRow({
  assetType,
  item,
  ...props
}: any) {
  const { navigate } = useNavigation();

  const handleOpenExpandedState = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET_POOLS, {
      asset: item,
      cornerRadius: 39,
      type: assetType,
    });
  }, [assetType, item, navigate]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Content onPress={handleOpenExpandedState} scaleTo={0.96}>
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
    </Content>
  );
}
