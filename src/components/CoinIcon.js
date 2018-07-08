import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import DefaultCoinIcon, { FallbackIcon as DefaultFallbackIcon } from 'react-coin-icon';
import { fonts } from '../styles';

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFMono};
  margin-bottom: 1;
`;

const FallbackIcon = ({ symbol }) => (
  <DefaultFallbackIcon
    symbol={symbol}
    textStyles={fallbackTextStyles}
  />
);

FallbackIcon.propTypes = DefaultFallbackIcon.propTypes;

const CoinIcon = ({ size, symbol }) => (
  <DefaultCoinIcon
    fallbackRenderer={FallbackIcon}
    size={size}
    symbol={symbol}
  />
);

CoinIcon.propTypes = {
  symbol: PropTypes.string,
  size: PropTypes.number,
};

CoinIcon.defaultProps = {
  size: 40,
};

export default CoinIcon;
