import React from 'react';
import { useTheme } from '@/theme';
import { useNativeAsset } from '@/utils/ethereumUtils';
import RainbowCoinIcon from './RainbowCoinIcon';
import { ETH_SYMBOL } from '@/references';
import { ChainId } from '@/networks/types';

type EthCoinIconProps = {
  size?: number;
};

export const EthCoinIcon = ({ size = 40 }: EthCoinIconProps) => {
  const ethAsset = useNativeAsset({ chainId: ChainId.mainnet });
  const theme = useTheme();
  return (
    <RainbowCoinIcon
      size={size}
      icon={ethAsset?.icon_url}
      chainId={ChainId.mainnet}
      symbol={ethAsset?.symbol || ETH_SYMBOL}
      theme={theme}
      colors={ethAsset?.colors}
    />
  );
};
