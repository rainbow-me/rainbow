import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { CoinIcon } from '../coin-icon';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';

const Pill = styled(Centered)`
  ${padding(2.5, 6)};
  background-color: ${colors.alpha(colors.blueGreyDark, 0.07)};
  border-radius: 9.5;
`;

const InvestmentCardPill = ({ hideIcon, reverse, symbol, value }) => {
  const icon = hideIcon ? null : (
    <CoinIcon
      key={`CoinIcon-${symbol}`}
      showShadow={false}
      size={18}
      symbol={symbol}
    />
  );

  const label = (
    <Pill key={`Pill-${symbol}`}>
      <Text letterSpacing="loose" size="smaller" weight="semibold">
        {`${value} ${symbol}`}
      </Text>
    </Pill>
  );

  const children = [icon, label];
  return (
    <RowWithMargins margin={5} key={`RowWithMargins-${symbol}`}>
      {reverse ? children.reverse() : children}
    </RowWithMargins>
  );
};

InvestmentCardPill.propTypes = {
  hideIcon: PropTypes.bool,
  reverse: PropTypes.bool,
  symbol: PropTypes.string,
  value: PropTypes.number,
};

export default React.memo(InvestmentCardPill);
