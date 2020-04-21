import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const sx = StyleSheet.create({
  pill: {
    backgroundColor: colors.alpha(colors.blueGreyDark, 0.06),
    borderRadius: 20,
    marginHorizontal: 5,
    paddingBottom: 2.5,
    paddingHorizontal: 6,
    paddingTop: 1.8,
  },
});

const InvestmentCardPill = ({ hideIcon, reverse, symbol, value }) => {
  const icon = hideIcon ? null : (
    <CoinIcon
      key={`CoinIcon-${symbol}`}
      showShadow={false}
      size={20}
      symbol={symbol}
    />
  );

  const label = (
    <Centered key={`Pill-${symbol}`} style={sx.pill}>
      <Text letterSpacing="roundedTight" size="small" weight="semibold">
        {`${value} ${symbol}`}
      </Text>
    </Centered>
  );

  const children = [icon, label];
  return (
    <Row key={`RowWithMargins-${symbol}`}>
      {reverse ? children.reverse() : children}
    </Row>
  );
};

InvestmentCardPill.propTypes = {
  hideIcon: PropTypes.bool,
  reverse: PropTypes.bool,
  symbol: PropTypes.string,
  value: PropTypes.number,
};

export default React.memo(InvestmentCardPill);
