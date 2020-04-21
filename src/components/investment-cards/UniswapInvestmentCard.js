import { floor } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { useNavigation, useNavigationState } from 'react-navigation-hooks';
import { withProps } from 'recompact';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { useAccountSettings, useOpenInvestmentCards } from '../../hooks';
import { colors, padding } from '../../styles';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { ColumnWithMargins, Row } from '../layout';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import InvestmentCardPill from './InvestmentCardPill';

const UniswapInvestmentCardHeight = 114;

const gradientColors = [
  colors.uniswapInvestmentCards.startGradient,
  colors.uniswapInvestmentCards.endGradient,
];

const AssetLabel = withProps({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'tight',
  size: 'smedium',
})(Text);

const UniswapInvestmentCard = ({
  assetType,
  isCollapsible,
  item,
  ...props
}) => {
  const { nativeCurrency } = useAccountSettings();
  const { openInvestmentCards } = useOpenInvestmentCards();

  const { navigate } = useNavigation();
  const { routeName } = useNavigationState();

  const handleOpenExpandedState = useCallback(() => {
    navigate('ExpandedAssetScreen', {
      asset: item,
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

  const isExpandedState = routeName === 'ExpandedAssetScreen';

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
