import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, margin, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const Pill = styled(Centered)`
  ${padding(1.8, 6, 2.5, 6)};
  background-color: ${colors.alpha(colors.blueGreyDark, 0.06)};
  border-radius: 20;
  ${margin(0, 5, 0, 5)};
`;

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
    <Pill key={`Pill-${symbol}`}>
      <Text letterSpacing="roundedTight" size="small" weight="semibold">
        {`${value} ${symbol}`}
      </Text>
    </Pill>
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
