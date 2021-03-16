import { isNil } from 'lodash';
import React, { Fragment } from 'react';
import ReactCoinIcon from 'react-coin-icon';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import CoinIconFallback from './CoinIconFallback';
import CoinIconIndicator from './CoinIconIndicator';
import { useColorForAsset } from '@rainbow-me/hooks';
import { getTokenMetadata, isETH, magicMemo } from '@rainbow-me/utils';

export const CoinIconSize = 40;

const StyledCoinIcon = styled(ReactCoinIcon)`
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

const CoinIcon = ({
  address = 'eth',
  forcedShadowColor,
  isHidden,
  isPinned,
  size = CoinIconSize,
  symbol = '',
  ...props
}) => {
  const tokenMetadata = getTokenMetadata(address);
  const color = useColorForAsset({ address });
  const { colors, isDarkMode } = useTheme();

  const forceFallback = !isETH(address) && isNil(tokenMetadata);

  return (
    <Fragment>
      {(isPinned || isHidden) && <CoinIconIndicator isPinned={isPinned} />}
      <StyledCoinIcon
        {...props}
        address={address}
        color={color}
        fallbackRenderer={CoinIconFallback}
        forceFallback={forceFallback}
        // force update on change symbol due to ImageCache strategy
        key={symbol}
        shadowColor={
          forcedShadowColor ||
          (isDarkMode ? colors.shadow : tokenMetadata?.shadowColor || color)
        }
        size={size}
        symbol={symbol}
      />
    </Fragment>
  );
};

export default magicMemo(CoinIcon, [
  'address',
  'isHidden',
  'isPinned',
  'size',
  'symbol',
  'shadowColor',
]);
