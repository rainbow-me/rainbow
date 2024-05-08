import { Hex } from 'viem';

import { ParsedSearchAsset, ParsedUserAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';

const ASSET_ARRAY = [
  {
    address: 'eth',
    balance: { amount: '0.097973569139074245', display: '0.09797357 ETH' },
    bridging: { isBridgeable: true, networks: [Object] },
    chainId: 1,
    chainName: 'mainnet',
    colors: { fallback: '#E8EAF5', primary: '#808088' },
    decimals: 18,
    icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
    isNativeAsset: true,
    mainnetAddress: 'eth',
    name: 'Ethereum',
    native: { balance: [Object], price: [Object] },
    networks: {
      '1': [Object],
      '10': [Object],
      '42161': [Object],
      '56': [Object],
      '7777777': [Object],
      '81457': [Object],
      '8453': [Object],
    },
    price: { changed_at: 1715201043, relative_change_24h: -3.4066153659679133, value: 2948.6000000000004 },
    smallBalance: false,
    standard: undefined,
    symbol: 'ETH',
    type: 'native',
    uniqueId: 'eth_1',
  },
  {
    address: '0x030ba81f1c18d280636f32af80b9aad02cf0854e',
    balance: { amount: '0.050239844219960838', display: '0.05023984 aWETH' },
    bridging: { isBridgeable: false, networks: [Object] },
    chainId: 1,
    chainName: 'mainnet',
    colors: { fallback: '#AC58A2', primary: '#25292E', shadow: '#7285B2' },
    decimals: 18,
    icon_url:
      'https://rainbowme-res.cloudinary.com/image/upload/v1668633501/assets/ethereum/0x030ba81f1c18d280636f32af80b9aad02cf0854e.png',
    isNativeAsset: false,
    mainnetAddress: '0x030ba81f1c18d280636f32af80b9aad02cf0854e',
    name: 'Aave WETH',
    native: { balance: [Object], price: [Object] },
    networks: { '1': [Object] },
    price: { changed_at: 1715201043, relative_change_24h: -3.4066153659679133, value: 2948.6000000000004 },
    smallBalance: false,
    standard: undefined,
    symbol: 'aWETH',
    type: 'aave-v2',
    uniqueId: '0x030ba81f1c18d280636f32af80b9aad02cf0854e_1',
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    balance: { amount: '0.014773123130869917', display: '0.01477312 ETH' },
    bridging: { isBridgeable: true, networks: [Object] },
    chainId: 8453,
    chainName: 'base',
    colors: { fallback: '#E8EAF5', primary: '#808088' },
    decimals: 18,
    icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
    isNativeAsset: true,
    mainnetAddress: 'eth',
    name: 'Ethereum',
    native: { balance: [Object], price: [Object] },
    networks: {
      '1': [Object],
      '10': [Object],
      '42161': [Object],
      '56': [Object],
      '7777777': [Object],
      '81457': [Object],
      '8453': [Object],
    },
    price: { changed_at: 1715201043, relative_change_24h: -3.4066153659679133, value: 2948.6000000000004 },
    smallBalance: false,
    standard: undefined,
    symbol: 'ETH',
    type: 'native',
    uniqueId: 'eth_8453',
  },
  {
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    balance: { amount: '5041131.766898238726728294', display: '5,041,131.767 PEPE' },
    bridging: { isBridgeable: false, networks: [Object] },
    chainId: 1,
    chainName: 'mainnet',
    colors: { fallback: '#A35F65', primary: '#009110' },
    decimals: 18,
    icon_url:
      'https://rainbowme-res.cloudinary.com/image/upload/v1681981536/assets/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933.png',
    isNativeAsset: false,
    mainnetAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    name: 'Pepe',
    native: { balance: [Object], price: [Object] },
    networks: { '1': [Object], '10': [Object], '8453': [Object] },
    price: { changed_at: 1715201043, relative_change_24h: -5.600284935095212, value: 0.000007740075 },
    smallBalance: false,
    standard: undefined,
    symbol: 'PEPE',
    type: undefined,
    uniqueId: '0x6982508145454ce325ddbe47a25d4ec3d2311933_1',
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    balance: { amount: '0.061878960708866532', display: '0.06187896 BNB' },
    bridging: { isBridgeable: false, networks: [Object] },
    chainId: 56,
    chainName: 'bsc',
    colors: { fallback: '#F8D888', primary: '#f3ba2f' },
    decimals: 18,
    icon_url:
      'https://rainbowme-res.cloudinary.com/image/upload/v1668633498/assets/ethereum/0xb8c77482e45f1f44de1745f52c74426c631bdd52.png',
    isNativeAsset: true,
    mainnetAddress: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
    name: 'BNB',
    native: { balance: [Object], price: [Object] },
    networks: { '1': [Object], '137': [Object], '42161': [Object], '56': [Object] },
    price: { changed_at: 1715201043, relative_change_24h: -0.45274514153287315, value: 583.904977482 },
    smallBalance: false,
    standard: undefined,
    symbol: 'BNB',
    type: 'native',
    uniqueId: '0xb8c77482e45f1f44de1745f52c74426c631bdd52_56',
  },
  {
    address: '0x0000000000000000000000000000000000001010',
    balance: { amount: '49.907963756410822962', display: '49.908 MATIC' },
    bridging: { isBridgeable: true, networks: [Object] },
    chainId: 137,
    chainName: 'polygon',
    colors: { fallback: '#81D5F8', primary: '#2891F9' },
    decimals: 18,
    icon_url:
      'https://rainbowme-res.cloudinary.com/image/upload/v1668633495/assets/ethereum/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png',
    isNativeAsset: true,
    mainnetAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    name: 'Matic',
    native: { balance: [Object], price: [Object] },
    networks: { '1': [Object], '10': [Object], '137': [Object], '42161': [Object] },
    price: { changed_at: 1715201043, relative_change_24h: -3.766476355334003, value: 0.678119028 },
    smallBalance: false,
    standard: undefined,
    symbol: 'MATIC',
    type: 'native',
    uniqueId: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0_137',
  },
];

export interface UserAssetsState {
  userAssetIds: UniqueId[];
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  filter: UserAssetFilter;
  searchQuery: string;
  favoriteAssetsAddresses: Hex[]; // this is chain agnostic, so we don't want to store a UniqueId here
  setFavorites: (favoriteAssetIds: Hex[]) => void;
  getFilteredUserAssetIds: () => UniqueId[];
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset;
  isFavorite: (uniqueId: UniqueId) => boolean;
}

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    return JSON.stringify({
      state: {
        ...state,
        userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      },
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for user assets storage'), { error });
    throw error;
  }
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = UserAssetsState & {
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
};

function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: UserAssetsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from user assets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      userAssets: userAssetsData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (set, get) => ({
    userAssetIds: ASSET_ARRAY.map(obj => obj.uniqueId),
    userAssets: ASSET_ARRAY.reduce((map, obj) => {
      map.set(obj.uniqueId, obj);
      return map;
    }, new Map()),
    filter: 'all',
    searchQuery: '',
    favoriteAssetsAddresses: [],

    getFilteredUserAssetIds: () => {
      const { userAssetIds, userAssets, searchQuery } = get();

      // NOTE: No search query let's just return the userAssetIds
      if (!searchQuery.trim()) {
        return userAssetIds;
      }

      const lowerCaseSearchQuery = searchQuery.toLowerCase();
      const keysToMatch: Partial<keyof ParsedSearchAsset>[] = ['name', 'symbol', 'address'];

      return Object.entries(userAssets).reduce((acc, [uniqueId, asset]) => {
        const combinedString = keysToMatch
          .map(key => asset?.[key as keyof ParsedSearchAsset] ?? '')
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (combinedString.includes(lowerCaseSearchQuery)) {
          acc.push(uniqueId);
        }
        return acc;
      }, [] as UniqueId[]);
    },

    setFavorites: (addresses: Hex[]) => set({ favoriteAssetsAddresses: addresses }),

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) as ParsedSearchAsset,

    isFavorite: (uniqueId: UniqueId) => {
      const { favoriteAssetsAddresses } = get();

      const { address } = deriveAddressAndChainWithUniqueId(uniqueId);

      return favoriteAssetsAddresses.includes(address);
    },
  })
  // {
  //   storageKey: 'userAssets',
  //   version: 1,
  //   partialize: state => ({
  //     userAssetIds: state.userAssetIds,
  //     userAssets: state.userAssets,
  //     favoriteAssetsAddresses: state.favoriteAssetsAddresses,
  //   }),
  //   serializer: serializeUserAssetsState,
  //   deserializer: deserializeUserAssetsState,
  // }
);
