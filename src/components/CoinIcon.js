import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components/primitives';
import DefaultCoinIcon, { FallbackIcon as DefaultFallbackIcon } from 'react-coin-icon';
import { colors, fonts, position, shadow } from '../styles';
import { Centered } from './layout';

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFMono};
  margin-bottom: 1;
`;

const Shadow = styled(Centered)`
  ${({ size }) => position.size(size)}
  ${shadow.build(0, 4, 6, colors.alpha(colors.purple, 0.04))}}
  ${shadow.build(0, 1, 3, colors.alpha(colors.purple, 0.08))}}
  background-color: ${colors.alpha(colors.purple, 0.04)};
  border-radius: ${({ size }) => (size / 2)};
`;

const CoinIcon = ({ size, symbol }) => (
  <Shadow size={size}>
    <DefaultCoinIcon
      fallbackRenderer={() => (
        <DefaultFallbackIcon
          symbol={symbol}
          textStyles={fallbackTextStyles}
        />
      )}
      size={size}
      symbol={symbol}
    />
  </Shadow>
);

CoinIcon.propTypes = {
  symbol: PropTypes.string,
  size: PropTypes.number,
};

CoinIcon.defaultProps = {
  size: 40,
};

export default CoinIcon;
