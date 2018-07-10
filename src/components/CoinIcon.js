import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components/primitives';
import DefaultCoinIcon, { FallbackIcon as DefaultFallbackIcon } from 'react-coin-icon';
import { colors, fonts, position } from '../styles';
import { Centered } from './layout';

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFMono};
  margin-bottom: 1;
`;

const Shadow = styled(Centered)`
  ${({ size }) => position.size(size)}
  background-color: ${colors.alpha(colors.purple, 0.04)};
  border-radius: ${({ size }) => (size / 2)};
  box-shadow: 0px 4px 6px ${colors.alpha(colors.purple, 0.04)};
  box-shadow: 0px 1px 3px ${colors.alpha(colors.purple, 0.08)};
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
