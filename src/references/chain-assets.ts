import { ChainId } from '@/__swaps__/types/chains';
import { RainbowAddressAssets } from '@/resources/assets/types';
import { ETH_ADDRESS } from '.';
import { Network } from '@/networks/types';

/**
 * @deprecated Use the chainAssets file instead
 */
export const chainAssets = {
  goerli: [
    {
      asset: {
        address: ETH_ADDRESS,
        asset_code: 'eth',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        chainId: ChainId.goerli,
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
        name: 'Goerli',
        network: Network.goerli,
        price: {
          changed_at: 1582568575,
          relative_change_24h: -4.586615622469276,
          value: 259.2,
        },
        uniqueId: `${ETH_ADDRESS}_${ChainId.goerli}`,
        symbol: 'ETH',
      },
    },
  ],
  mainnet: [
    {
      asset: {
        asset_code: 'eth',
        address: ETH_ADDRESS,
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        chainId: ChainId.mainnet,
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
        name: 'Ethereum',
        network: Network.mainnet,
        price: {
          changed_at: 1582568575,
          relative_change_24h: -4.586615622469276,
          value: 259.2,
        },
        uniqueId: `${ETH_ADDRESS}_${ChainId.mainnet}`,
        symbol: 'ETH',
      },
    },
  ],
};

type ChainAssetsByChainId = Partial<{
  [key in ChainId]: RainbowAddressAssets[];
}>;

export const chainAssetsByChainId: ChainAssetsByChainId = {
  [ChainId.mainnet]: chainAssets.mainnet,
  [ChainId.goerli]: chainAssets.goerli,
};

export default chainAssets;
