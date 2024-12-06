import { UniqueId, ZerionAsset } from '@/__swaps__/types/assets';
import { ChainId, ChainName } from '@/state/backendNetworks/types';

type ChainAssets = {
  [uniqueId: UniqueId]: {
    asset: ZerionAsset;
    quantity: string;
  };
};

// NOTE: Don't import `ETH_ADDRESS` as it's resolving to undefined...
export const chainAssets: Partial<Record<ChainId, ChainAssets>> = {
  [ChainId.goerli]: {
    eth_5: {
      asset: {
        asset_code: 'eth',
        mainnet_address: 'eth',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {}, // TODO: Add bridgeable networks
        },
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
        name: 'Goerli',
        network: ChainName.goerli,
        price: {
          relative_change_24h: -4.586615622469276,
          value: 2590.2,
        },
        symbol: 'ETH',
      },
      quantity: '0',
    },
  },
  [ChainId.mainnet]: {
    eth_1: {
      asset: {
        asset_code: 'eth',
        mainnet_address: 'eth',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/ETH.png',
        name: 'Ethereum',
        network: ChainName.mainnet,
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {}, // TODO: Add bridgeable networks
        },
        price: {
          relative_change_24h: -4.586615622469276,
          value: 2590.2,
        },
        symbol: 'ETH',
      },
      quantity: '0',
    },
  },
};

export default chainAssets;
