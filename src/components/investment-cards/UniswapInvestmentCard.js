import { floor } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  pure,
  withHandlers,
  withProps,
} from 'recompact';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { withAccountSettings, withOpenInvestmentCards } from '../../hoc';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Divider from '../Divider';
import { ColumnWithMargins, Row } from '../layout';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import InvestmentCardPill from './InvestmentCardPill';

const UniswapInvestmentCardHeight = 114;

const AssetLabel = withProps({
  color: 'blueGreyDarkTransparent',
  lineHeight: 'tight',
  size: 'smedium',
})(Text);

const enhance = compose(
  withAccountSettings,
  pure,
  withHandlers({
    onPressContainer: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
);

const UniswapInvestmentCard = enhance(({
  isCollapsible,
  item: {
    ethBalance,
    tokenBalance,
    tokenName,
    tokenSymbol,
    totalBalanceAmount,
    totalNativeDisplay,
    uniqueId,
  },
  nativeCurrency,
  onPress,
  onPressContainer,
  openInvestmentCards,
  ...props
}) => (
  <InvestmentCard
    {...props}
    flex={0}
    gradientColors={['#ECF1F5', '#E4E9F0']}
    collapsed={openInvestmentCards[uniqueId]}
    uniqueId={uniqueId}
    containerHeight={UniswapInvestmentCard.height}
    isExpandedState={!onPress}
    headerProps={{
      color: colors.dark,
      emoji: 'unicorn_face',
      isCollapsible,
      title: 'Uniswap',
      titleColor: '#D040FF',
      value: floor(parseFloat(totalBalanceAmount), 4)
        ? totalNativeDisplay
        : `< ${convertAmountToNativeDisplay(0.01, nativeCurrency)}`,
    }}
    height={UniswapInvestmentCardHeight}
  >
    <Divider
      backgroundColor={colors.transparent}
      color={colors.alpha(colors.blueGreyDark, 0.02)}
    />
    <ButtonPressAnimation
      disabled={!onPress}
      onPress={onPressContainer}
      scaleTo={0.96}
    >
      <ColumnWithMargins css={padding(8, 15, 15)} margin={6}>
        <Row align="center" justify="space-between">
          <AssetLabel>Ethereum</AssetLabel>
          <AssetLabel>{tokenName}</AssetLabel>
        </Row>
        <Row align="center" justify="space-between">
          <InvestmentCardPill
            symbol="ETH"
            value={ethBalance}
          />
          <InvestmentCardPill
            reverse
            symbol={tokenSymbol}
            value={tokenBalance}
          />
        </Row>
      </ColumnWithMargins>
    </ButtonPressAnimation>
  </InvestmentCard>
));

UniswapInvestmentCard.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

UniswapInvestmentCard.height = UniswapInvestmentCardHeight;

export default withOpenInvestmentCards(UniswapInvestmentCard);
