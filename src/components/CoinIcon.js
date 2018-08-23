import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import ReactCoinIcon, { FallbackIcon } from 'react-coin-icon';
import { colors, fonts, position, shadow } from '../styles';
import { ShadowStack } from './shadow-stack';

const CoinIconHeight = 40;

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFMono};
  margin-bottom: 1;
`;

const CoinIconFallback = fallbackProps => (
  <FallbackIcon
    {...fallbackProps}
    textStyles={fallbackTextStyles}
  />
);

const CoinIcon = ({ size, symbol }) => (
  <ShadowStack
    {...position.sizeAsObject(size)}
    borderRadius={size / 2}
    shadows={[
      shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
      shadow.buildString(0, 1, 3, colors.alpha(colors.purple, 0.24)),
    ]}
  >
    <ReactCoinIcon
      fallbackRenderer={CoinIconFallback}
      size={size}
      symbol={symbol}
    />
  </ShadowStack>
);

CoinIcon.propTypes = {
  symbol: PropTypes.string,
  size: PropTypes.number,
};

CoinIcon.defaultProps = {
  size: CoinIconHeight,
};

CoinIcon.height = CoinIconHeight;

export default CoinIcon;
