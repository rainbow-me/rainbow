import { floor } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  pure,
  withHandlers,
  withProps,
} from 'recompact';
import { withAccountSettings } from '../../hoc';
import { colors, padding } from '../../styles';
import { removeCurrencySymbols } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import Divider from '../Divider';
import { ColumnWithMargins, Row } from '../layout';
import { Text } from '../text';
import InvestmentCard from './InvestmentCard';
import InvestmentCardPill from './InvestmentCardPill';

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
    totalNativeDisplay,
  },
  onPress,
  onPressContainer,
  nativeCurrencySymbol,
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
      gradientColors={['#F7FAFC', '#E0E6EC']}
      headerProps={{
        color: colors.dark,
        emoji: 'unicorn_face',
        title: 'Uniswap',
        titleColor: '#D040FF',
        value: floor(parseFloat(removeCurrencySymbols(totalNativeDisplay)), 4)
          ? totalNativeDisplay
          : `< ${nativeCurrencySymbol}0.01`,
      }}
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
};

UniswapInvestmentCard.height = 114;

export default UniswapInvestmentCard;
