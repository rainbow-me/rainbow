import { AnimatedChainImage as AnimatedChainImageIOS } from './AnimatedChainImage.ios';
import { AnimatedChainImage as AnimatedChainImageAndroid } from './AnimatedChainImage.android';
import { IS_IOS } from '@/env';

import { AddressZero } from '@ethersproject/constants';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { chainsName } from '@/chains';
import { ETH_ADDRESS } from '@/references';
import { ChainId } from '@/chains/types';
import { StyleProp, ViewStyle } from 'react-native';

export type ShadowConfig = {
  shadowColor: string;
  shadowOffset: {
    height: number;
    width: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
};

export type AnimatedChainImageProps = {
  assetType: 'input' | 'output';
  showMainnetBadge?: boolean;
  shadowConfig?: ShadowConfig;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export const getCustomChainIconUrl = (chainId: ChainId, address?: AddressOrEth) => {
  const chainName = chainsName[chainId];
  if (!chainName || !address) return '';
  const baseUrl = 'https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/';

  if (address === AddressZero || address === ETH_ADDRESS) {
    return `${baseUrl}${chainName}/info/logo.png`;
  } else {
    return `${baseUrl}${chainName}/assets/${address}/logo.png`;
  }
};

const componentToExport = IS_IOS ? AnimatedChainImageIOS : AnimatedChainImageAndroid;

export { componentToExport as AnimatedChainImage };
