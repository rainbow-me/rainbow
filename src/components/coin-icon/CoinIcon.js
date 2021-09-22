import { isNil } from 'lodash';
import React from 'react';
import ReactCoinIcon from 'react-coin-icon';
import { View } from 'react-native';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import ChainBadge from './ChainBadge';
import CoinIconFallback from './CoinIconFallback';
import { useColorForAsset } from '@rainbow-me/hooks';
import { getTokenMetadata, isETH, magicMemo } from '@rainbow-me/utils';

export const CoinIconSize = 40;

const StyledCoinIcon = styled(ReactCoinIcon)`
  opacity: ${({ isHidden }) => (isHidden ? 0.4 : 1)};
`;

const CoinIcon = ({
  address = 'eth',
  badgeXPosition,
  badgeYPosition,
  badgeSize,
  forcedShadowColor,
  size = CoinIconSize,
  symbol = '',
  type,
  ...props
}) => {
  const tokenMetadata = getTokenMetadata(props.mainnet_address || address);
  const color = useColorForAsset({ address: props.mainnet_address || address });
  const { colors, isDarkMode } = useTheme();
  const forceFallback =
    !isETH(props.mainnet_address || address) && isNil(tokenMetadata);

  return (
    <View>
      <StyledCoinIcon
        {...props}
        address={props.mainnet_address || address}
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
      <ChainBadge
        assetType={type}
        badgeXPosition={badgeXPosition}
        badgeYPosition={badgeYPosition}
        size={badgeSize}
      />
    </View>
  );
};

export default magicMemo(CoinIcon, [
  'address',
  'isHidden',
  'isPinned',
  'size',
  'type',
  'symbol',
  'shadowColor',
]);
