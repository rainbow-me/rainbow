import { isNil } from 'lodash';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import ContractInteraction from '../../assets/contractInteraction.png';
import { useTheme } from '../../theme/ThemeContext';
import ChainBadge from './ChainBadge';
import CoinIconFallback from './CoinIconFallback';
import { AssetTypes } from '@rainbow-me/entities';
import { useColorForAsset } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import {
  getTokenMetadata,
  isETH,
  magicMemo,
  CoinIcon as ReactCoinIcon,
} from '@rainbow-me/utils';

export const CoinIconSize = 40;

const ContractInteractionIcon = styled(ImgixImage)(({ size }) => ({
  height: size,
  width: size,
}));

const StyledCoinIcon = styled(ReactCoinIcon)({
  opacity: ({ isHidden }) => (isHidden ? 0.4 : 1),
});

const CoinIcon = ({
  address = 'eth',
  badgeXPosition,
  badgeYPosition,
  badgeSize,
  ignoreBadge = false,
  forcedShadowColor,
  size = CoinIconSize,
  symbol = '',
  type,
  ...props
}) => {
  const tokenMetadata = getTokenMetadata(props.mainnet_address || address);
  const color = useColorForAsset({
    address: props.mainnet_address || address,
    type: props.mainnet_address ? AssetTypes.token : type,
  });
  const { colors, isDarkMode } = useTheme();
  const forceFallback =
    !isETH(props.mainnet_address || address) && isNil(tokenMetadata);
  const isNotContractInteraction = useMemo(() => symbol !== 'contract', [
    symbol,
  ]);

  return (
    <View>
      {isNotContractInteraction ? (
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
          type={props.mainnet_address ? AssetTypes.token : type}
        />
      ) : (
        <ContractInteractionIcon size={size} source={ContractInteraction} />
      )}
      {!ignoreBadge && (
        <ChainBadge
          assetType={type}
          badgeXPosition={badgeXPosition}
          badgeYPosition={badgeYPosition}
          size={badgeSize}
        />
      )}
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
