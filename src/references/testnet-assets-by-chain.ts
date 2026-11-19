import { ChainId, ChainName } from '@/features/network/types/backendNetworks';
import { type Asset } from '@/state/assets/types';

// NOTE: Don't import `ETH_ADDRESS` as it's resolving to undefined...
export const anvilAssets: readonly Asset[] = [
  {
    address: 'eth',
    mainnetAddress: 'eth',
    chainId: ChainId.mainnet,
    colors: {
      fallback: '#E8EAF5',
      primary: '#808088',
    },
    decimals: 18,
    iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
    name: 'Ethereum',
    network: ChainName.mainnet,
    verified: false,
    transferable: true,
    bridging: {
      bridgeable: true,
      networks: {
        '10': { bridgeable: true },
        '56': { bridgeable: true },
        '130': { bridgeable: true },
        '324': { bridgeable: true },
        '8453': { bridgeable: true },
        '42161': { bridgeable: true },
        '57073': { bridgeable: true },
        '59144': { bridgeable: true },
        '81457': { bridgeable: true },
        '534352': { bridgeable: true },
        '7777777': { bridgeable: true },
      },
    },
    price: {
      relativeChange24h: -4.586615622469276,
      value: 2590.2,
    },
    symbol: 'ETH',
    type: 'native',
    networks: {
      [ChainId.mainnet]: {
        address: 'eth',
        decimals: 18,
      },
    },
  },
  {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    mainnetAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    chainId: ChainId.mainnet,
    colors: {
      fallback: '#F8D888',
      primary: '#F0B340',
    },
    decimals: 18,
    iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668633496/assets/ethereum/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    name: 'Dai',
    network: ChainName.mainnet,
    verified: false,
    transferable: true,
    bridging: {
      bridgeable: true,
      networks: {
        '10': { bridgeable: true },
        '56': { bridgeable: true },
        '137': { bridgeable: true },
        '8453': { bridgeable: true },
        '42161': { bridgeable: true },
        '43114': { bridgeable: true },
        '81457': { bridgeable: false },
        '7777777': { bridgeable: false },
      },
    },
    price: {
      relativeChange24h: 0,
      value: 1,
    },
    symbol: 'DAI',
    type: 'stablecoin',
    networks: {
      [ChainId.mainnet]: {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
      },
    },
  },
  {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    mainnetAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    chainId: ChainId.mainnet,
    colors: {
      fallback: '#E8EAF5',
      primary: '#808088',
    },
    decimals: 18,
    iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668633499/assets/ethereum/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    name: 'Wrapped Ether',
    network: ChainName.mainnet,
    verified: false,
    transferable: true,
    bridging: {
      bridgeable: true,
      networks: {},
    },
    price: {
      relativeChange24h: -4.586615622469276,
      value: 2590.2,
    },
    symbol: 'WETH',
    type: 'wrappedNative',
    networks: {
      [ChainId.mainnet]: {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        decimals: 18,
      },
    },
  },
];
