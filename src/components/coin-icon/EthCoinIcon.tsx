import React from 'react';
import { Network } from '@/networks/types';
import { ThemeContextProps, useTheme } from '@/theme';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import RainbowCoinIcon from './RainbowCoinIcon';
import { ETH_SYMBOL } from '@/references';

type EthCoinIconProps = {
  size?: number;
};

export const EthCoinIcon = ({ size = 40 }: EthCoinIconProps) => {
  const ethAsset = useNativeAssetForNetwork(Network.mainnet);
  const theme = useTheme();
  return (
    <RainbowCoinIcon
      size={size}
      icon={ethAsset?.icon_url}
      network={Network.mainnet}
      symbol={ethAsset?.symbol || ETH_SYMBOL}
      theme={theme}
      colors={ethAsset?.colors}
    />
  );
};
