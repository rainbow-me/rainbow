import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import ReactCoinIcon, { FallbackIcon } from 'react-coin-icon';
import { onlyUpdateForKeys } from 'recompact';
import { borders, colors, fonts, shadow } from '../../styles';
import { ShadowStack } from '../shadow-stack';

const CoinIconSize = 40;

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

const enhance = onlyUpdateForKeys(['symbol']);
const CoinIcon = enhance(({ size, symbol }) => (
  <ShadowStack
    {...borders.buildCircleAsObject(size)}
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
));

CoinIcon.propTypes = {
  symbol: PropTypes.string,
  size: PropTypes.number,
};

CoinIcon.defaultProps = {
  size: CoinIconSize,
};

CoinIcon.size = CoinIconSize;

export default CoinIcon;
