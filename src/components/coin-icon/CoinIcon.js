import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'styled-components/primitives';
import ReactCoinIcon, { FallbackIcon } from 'react-coin-icon';
import { hoistStatics, onlyUpdateForKeys } from 'recompact';
import {
  borders,
  colors,
  fonts,
  shadow,
} from '../../styles';
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

const CoinIcon = ({ showShadow, size, symbol }) => {
  const coinIcon = (
    <ReactCoinIcon
      fallbackRenderer={CoinIconFallback}
      size={size}
      symbol={symbol}
    />
  );

  return showShadow ? (
    <ShadowStack
      {...borders.buildCircleAsObject(size)}
      shadows={[
        shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.12)),
        shadow.buildString(0, 1, 3, colors.alpha(colors.purple, 0.24)),
      ]}
      shouldRasterizeIOS={true}
    >
      {coinIcon}
    </ShadowStack>
  ) : coinIcon;
};

CoinIcon.propTypes = {
  showShadow: PropTypes.bool,
  size: PropTypes.number,
  symbol: PropTypes.string,
};

CoinIcon.defaultProps = {
  showShadow: true,
  size: CoinIconSize,
};

CoinIcon.size = CoinIconSize;

const enhance = onlyUpdateForKeys(['symbol']);
export default hoistStatics(enhance)(CoinIcon);
