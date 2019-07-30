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
import { withAccountSettings } from '../../hoc';
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
  item: {
    ethBalance,
    tokenBalance,
    tokenName,
    tokenSymbol,
    totalBalanceAmount,
    totalNativeDisplay,
  },
  onPress,
  onPressContainer,
  nativeCurrency,
  ...props
}) => (
  <ButtonPressAnimation
    disabled={!onPress}
    onPress={onPressContainer}
    scaleTo={0.96}
  >
    <InvestmentCard
      {...props}
      flex={0}
      gradientColors={['#ECF1F5', '#E4E9F0']}
      headerProps={{
        color: colors.dark,
        emoji: 'unicorn_face',
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
    </InvestmentCard>
  </ButtonPressAnimation>
));

UniswapInvestmentCard.propTypes = {
  item: PropTypes.object,
  nativeCurrency: PropTypes.string,
  onPress: PropTypes.func,
  onPressContainer: PropTypes.func,
};

UniswapInvestmentCard.height = UniswapInvestmentCardHeight;

export default UniswapInvestmentCard;
