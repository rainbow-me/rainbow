import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components/primitives';
import DefaultCoinIcon, { FallbackIcon as DefaultFallbackIcon } from 'react-coin-icon';
import { colors, fonts, position, shadow } from '../styles';
import ShadowStack from './ShadowStack';

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFMono};
  margin-bottom: 1;
`;

const CoinIcon = ({ size, symbol }) => (
  <ShadowStack
    {...position.sizeAsObject(size)}
    borderRadius={(size / 2)}
    shadows={[
      shadow.buildString(0, 4, 6, colors.alpha(colors.purple, 0.04)),
      shadow.buildString(0, 1, 3, colors.alpha(colors.purple, 0.08)),
    ]}
  >
    <DefaultCoinIcon
      fallbackRenderer={() => (
        <DefaultFallbackIcon
          {...position.sizeAsObject(size)}
          symbol={symbol}
          textStyles={fallbackTextStyles}
        />
      )}
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
  size: 40,
};

export default CoinIcon;
