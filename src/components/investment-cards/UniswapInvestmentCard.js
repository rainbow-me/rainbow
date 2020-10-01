import { useRoute } from '@react-navigation/native';
import { floor } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useAccountSettings, useOpenInvestmentCards } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { LiquidityPoolExpandedStateSheetHeight } from '../expanded-state/LiquidityPoolExpandedState';
import { ColumnWithMargins, Row } from '../layout';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import InvestmentCardPill from './InvestmentCardPill';
import Routes from '@rainbow-me/routes';
import { colors, padding } from '@rainbow-me/styles';

const UniswapInvestmentCardHeight = 114;

const gradientColors = [
  colors.uniswapInvestmentCards.startGradient,
  colors.uniswapInvestmentCards.endGradient,
];

const AssetLabel = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'tight',
  size: 'smedium',
})``;

const UniswapInvestmentCard = ({
  assetType,
  isCollapsible,
  item,
  ...props
}) => {
  const { nativeCurrency } = useAccountSettings();
  const { openInvestmentCards } = useOpenInvestmentCards();

  const { navigate } = useNavigation();
  const { name } = useRoute();

  const handleOpenExpandedState = useCallback(() => {
    navigate(Routes.EXPANDED_ASSET_SHEET, {
      asset: item,
      cornerRadius: 10,
      longFormHeight: LiquidityPoolExpandedStateSheetHeight,
      type: assetType,
    });
  }, [assetType, item, navigate]);

  const {
    ethBalance,
    tokenBalance,
    tokenName,
    tokenSymbol,
    totalBalanceAmount,
    totalNativeDisplay,
    uniqueId,
  } = item;

  const headerProps = useMemo(
    () => ({
      color: colors.dark,
      emoji: 'unicorn',
      isCollapsible,
      title: `ETH • ${tokenSymbol}`,
      titleColor: colors.flamingo,
      value: floor(parseFloat(totalBalanceAmount), 4)
        ? totalNativeDisplay
        : `< ${convertAmountToNativeDisplay(0.01, nativeCurrency)}`,
    }),
    [
      isCollapsible,
      nativeCurrency,
      tokenSymbol,
      totalBalanceAmount,
      totalNativeDisplay,
    ]
  );

  const isExpandedState = name === 'ExpandedAssetSheet';

  return (
    <InvestmentCard
      {...props}
      collapsed={openInvestmentCards[uniqueId]}
      containerHeight={UniswapInvestmentCard.height}
      gradientColors={gradientColors}
      headerProps={headerProps}
      height={UniswapInvestmentCardHeight}
      isExpandedState={isExpandedState}
      uniqueId={uniqueId}
    >
      <Divider
        backgroundColor={colors.transparent}
        color={colors.alpha(colors.blueGreyDark, 0.02)}
      />
      <ButtonPressAnimation
        disabled={isExpandedState}
        onPress={handleOpenExpandedState}
        scaleTo={0.96}
      >
        <ColumnWithMargins css={padding(8, 15, 15)} margin={5}>
          <Row align="center" justify="space-between">
            <AssetLabel>Ethereum</AssetLabel>
            <AssetLabel>{tokenName}</AssetLabel>
          </Row>
          <Row align="center" justify="space-between">
            <InvestmentCardPill symbol="ETH" value={ethBalance} />
            <InvestmentCardPill
              reverse
              symbol={tokenSymbol}
              value={tokenBalance}
            />
          </Row>
        </ColumnWithMargins>
      </ButtonPressAnimation>
    </InvestmentCard>
  );
};

UniswapInvestmentCard.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

UniswapInvestmentCard.height = UniswapInvestmentCardHeight;

export default UniswapInvestmentCard;
