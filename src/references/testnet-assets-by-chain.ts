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
        icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
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
  // Mainnet Assets
  [ChainId.mainnet]: {
    // Mainnet ETH
    'eth_1': {
      asset: {
        asset_code: 'eth',
        mainnet_address: 'eth',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        decimals: 18,
        icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
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
        isNativeAsset: true,
      },
      quantity: '0',
    },
    // Mainnet DAI
    '0x6b175474e89094c44da98b954eedeac495271d0f_1': {
      asset: {
        asset_code: '0x6b175474e89094c44da98b954eedeac495271d0f',
        mainnet_address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        colors: {
          fallback: '#FCE57F',
          primary: '#F5AC37',
        },
        decimals: 18,
        icon_url: 'https://s3.amazonaws.com/icons.assets/DAI.png',
        name: 'Dai',
        network: ChainName.mainnet,
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {},
        },
        price: {
          relative_change_24h: 0,
          value: 1,
        },
        symbol: 'DAI',
        isNativeAsset: false,
      },
      quantity: '0',
    },
    // Mainnet WETH
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2_1': {
      asset: {
        asset_code: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        mainnet_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        decimals: 18,
        icon_url:
          'https://rainbowme-res.cloudinary.com/image/upload/v1668633499/assets/ethereum/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
        name: 'Wrapped Ether',
        network: ChainName.mainnet,
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {},
        },
        price: {
          relative_change_24h: -4.586615622469276,
          value: 2590.2,
        },
        symbol: 'WETH',
        isNativeAsset: false,
      },
      quantity: '0',
    },
  },
  // Anvil Assets (when using Anvil as local testnet)
  [ChainId.anvil]: {
    // Test ETH
    'eth_31337': {
      asset: {
        asset_code: 'eth',
        mainnet_address: 'eth',
        colors: {
          fallback: '#E8EAF5',
          primary: '#808088',
        },
        decimals: 18,
        icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
        name: 'Ethereum',
        network: ChainName.mainnet,
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {},
        },
        price: {
          relative_change_24h: -4.586615622469276,
          value: 2590.2,
        },
        symbol: 'ETH',
        isNativeAsset: true,
      },
      quantity: '0',
    },
    // Test Polygon Ecosystem Token (POL)
    '0x0000000000000000000000000000000000001010_31337': {
      asset: {
        asset_code: '0x0000000000000000000000000000000000001010',
        mainnet_address: '0x0000000000000000000000000000000000001010',
        colors: {
          fallback: '#8B47DB',
          primary: '#6E41BB',
        },
        decimals: 18,
        icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/polygon/matic.png',
        name: 'Polygon Ecosystem Token',
        network: ChainName.polygon, // L2 network for proper categorization
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {},
        },
        price: {
          relative_change_24h: 2.5,
          value: 0.85,
        },
        symbol: 'POL',
        isNativeAsset: true, // Native gas token for Polygon L2
      },
      quantity: '10000',
    },
  },
};

export default chainAssets;
