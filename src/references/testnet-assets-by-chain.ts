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
          networks: {
            '10': {
              bridgeable: true,
            },
            '56': {
              bridgeable: true,
            },
            '130': {
              bridgeable: true,
            },
            '324': {
              bridgeable: true,
            },
            '8453': {
              bridgeable: true,
            },
            '42161': {
              bridgeable: true,
            },
            '57073': {
              bridgeable: true,
            },
            '59144': {
              bridgeable: true,
            },
            '81457': {
              bridgeable: true,
            },
            '534352': {
              bridgeable: true,
            },
            '7777777': {
              bridgeable: true,
            },
          },
        },
        price: {
          relative_change_24h: -4.586615622469276,
          value: 2590.2,
          changed_at: Math.floor(Date.now() / 1000) - 100,
        },
        symbol: 'ETH',
        isNativeAsset: true,
        type: 'native',
        networks: {
          [ChainId.mainnet]: {
            address: 'eth',
            decimals: 18,
          },
        },
      },
      quantity: '0',
    },
    // Mainnet DAI
    '0x6b175474e89094c44da98b954eedeac495271d0f_1': {
      asset: {
        asset_code: '0x6b175474e89094c44da98b954eedeac495271d0f',
        mainnet_address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        colors: {
          fallback: '#F8D888',
          primary: '#F0B340',
        },
        decimals: 18,
        icon_url:
          'https://rainbowme-res.cloudinary.com/image/upload/v1668633496/assets/ethereum/0x6b175474e89094c44da98b954eedeac495271d0f.png',
        name: 'Dai',
        network: ChainName.mainnet,
        implementations: {},
        bridging: {
          bridgeable: true,
          networks: {
            '10': {
              bridgeable: true,
            },
            '56': {
              bridgeable: true,
            },
            '137': {
              bridgeable: true,
            },
            '8453': {
              bridgeable: true,
            },
            '42161': {
              bridgeable: true,
            },
            '43114': {
              bridgeable: true,
            },
            '81457': {
              bridgeable: false,
            },
            '7777777': {
              bridgeable: false,
            },
          },
        },
        price: {
          relative_change_24h: 0,
          value: 1,
          changed_at: Math.floor(Date.now() / 1000) - 100,
        },
        symbol: 'DAI',
        isNativeAsset: false,
        type: 'stablecoin',
        networks: {
          '1': {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18,
          },
          '10': {
            address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            decimals: 18,
          },
          '56': {
            address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
            decimals: 18,
          },
          '137': {
            address: '0x84000b263080bc37d1dd73a29d92794a6cf1564e',
            decimals: 18,
          },
          '8453': {
            address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
            decimals: 18,
          },
          '42161': {
            address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            decimals: 18,
          },
          '43114': {
            address: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
            decimals: 18,
          },
          '81457': {
            address: '0xee311c08162283b1493027b8ffb5293e7f2fd701',
            decimals: 18,
          },
          '7777777': {
            address: '0xd08a2917653d4e460893203471f0000826fb4034',
            decimals: 18,
          },
        },
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
          changed_at: Math.floor(Date.now() / 1000) - 100,
        },
        symbol: 'WETH',
        isNativeAsset: false,
        type: 'wrappedNative',
        networks: {
          [ChainId.mainnet]: {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            decimals: 18,
          },
        },
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
