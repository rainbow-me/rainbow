import { makeMutable, SharedValue } from 'react-native-reanimated';
import { queryClient } from '@/react-query';
import buildTimeNetworks from '@/references/networks.json';
import { backendNetworksQueryKey, BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { Chain } from 'viem/chains';
import { transformBackendNetworksToChains } from '@/state/backendNetworks/utils';
import { IS_TEST } from '@/env';
import { BackendNetwork, BackendNetworkServices, chainAnvil, chainAnvilOptimism, ChainId } from '@/state/backendNetworks/types';
import { GasSpeed } from '@/__swaps__/types/gas';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { colors as globalColors } from '@/styles';

const INITIAL_BACKEND_NETWORKS = queryClient.getQueryData<BackendNetworksResponse>(backendNetworksQueryKey()) ?? buildTimeNetworks;
const DEFAULT_PRIVATE_MEMPOOL_TIMEOUT = 2 * 60 * 1_000; // 2 minutes

export interface BackendNetworksState {
  backendNetworks: BackendNetworksResponse;
  backendNetworksSharedValue: SharedValue<BackendNetworksResponse>;

  getBackendChains: () => Chain[];
  getSupportedChains: () => Chain[];
  getSortedSupportedChainIds: () => number[];

  getDefaultChains: () => Record<ChainId, Chain>;
  getSupportedChainIds: () => ChainId[];
  getSupportedMainnetChains: () => Chain[];
  getSupportedMainnetChainIds: () => ChainId[];
  getNeedsL1SecurityFeeChains: () => ChainId[];
  getChainsNativeAsset: () => Record<ChainId, BackendNetwork['nativeAsset']>;
  getChainsLabel: () => Record<ChainId, string>;
  getChainsPrivateMempoolTimeout: () => Record<ChainId, number>;
  getChainsName: () => Record<ChainId, string>;
  getChainsBadge: () => Record<ChainId, string>;
  getChainsIdByName: () => Record<string, ChainId>;

  getColorsForChainId: (chainId: ChainId, isDarkMode: boolean) => string;

  defaultGasSpeeds: (chainId: ChainId) => GasSpeed[];

  getChainsGasSpeeds: () => Record<ChainId, GasSpeed[]>;
  defaultPollingInterval: (chainId: ChainId) => number;
  getChainsPollingInterval: () => Record<ChainId, number>;

  defaultSimplehashNetwork: (chainId: ChainId) => string;
  getChainsSimplehashNetwork: () => Record<ChainId, string>;
  filterChainIdsByService: (servicePath: (services: BackendNetworkServices) => boolean) => ChainId[];

  getMeteorologySupportedChainIds: () => ChainId[];
  getSwapSupportedChainIds: () => ChainId[];
  getSwapExactOutputSupportedChainIds: () => ChainId[];
  getBridgeExactOutputSupportedChainIds: () => ChainId[];
  getNotificationsSupportedChainIds: () => ChainId[];
  getApprovalsSupportedChainIds: () => ChainId[];
  getTransactionsSupportedChainIds: () => ChainId[];
  getSupportedAssetsChainIds: () => ChainId[];
  getSupportedPositionsChainIds: () => ChainId[];
  getTokenSearchSupportedChainIds: () => ChainId[];
  getNftSupportedChainIds: () => ChainId[];
  getFlashbotsSupportedChainIds: () => ChainId[];
  getShouldDefaultToFastGasChainIds: () => ChainId[];

  getChainGasUnits: (chainId?: ChainId) => BackendNetwork['gasUnits'];
  getChainDefaultRpc: (chainId: ChainId) => string;

  setBackendNetworks: (backendNetworks: BackendNetworksResponse) => void;
}

export const useBackendNetworksStore = createRainbowStore<BackendNetworksState>((set, get) => ({
  backendNetworks: INITIAL_BACKEND_NETWORKS,
  backendNetworksSharedValue: makeMutable<BackendNetworksResponse>(INITIAL_BACKEND_NETWORKS),

  getBackendChains: () => {
    const { backendNetworks } = get();
    return transformBackendNetworksToChains(backendNetworks.networks);
  },

  getSupportedChains: () => {
    const backendChains = get().getBackendChains();
    return IS_TEST ? [...backendChains, chainAnvil, chainAnvilOptimism] : backendChains;
  },

  getSortedSupportedChainIds: () => {
    const supportedChains = get().getSupportedChains();
    return supportedChains.sort((a, b) => a.name.localeCompare(b.name)).map(c => c.id);
  },

  getDefaultChains: () => {
    const supportedChains = get().getSupportedChains();
    return supportedChains.reduce(
      (acc, chain) => {
        acc[chain.id] = chain;
        return acc;
      },
      {} as Record<ChainId, Chain>
    );
  },

  getSupportedChainIds: () => {
    const supportedChains = get().getSupportedChains();
    return supportedChains.map(chain => chain.id);
  },

  getSupportedMainnetChains: () => {
    const supportedChains = get().getSupportedChains();
    return supportedChains.filter(chain => !chain.testnet);
  },

  getSupportedMainnetChainIds: () => {
    const supportedMainnetChains = get().getSupportedMainnetChains();
    return supportedMainnetChains.map(chain => chain.id);
  },

  getNeedsL1SecurityFeeChains: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks
      .filter((backendNetwork: BackendNetwork) => backendNetwork.opStack)
      .map((backendNetwork: BackendNetwork) => parseInt(backendNetwork.id, 10));
  },

  getChainsNativeAsset: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.nativeAsset;
        return acc;
      },
      {} as Record<ChainId, BackendNetwork['nativeAsset']>
    );
  },

  getChainsLabel: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.label;
        return acc;
      },
      {} as Record<ChainId, string>
    );
  },

  getChainsPrivateMempoolTimeout: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.privateMempoolTimeout || DEFAULT_PRIVATE_MEMPOOL_TIMEOUT;
        return acc;
      },
      {} as Record<ChainId, number>
    );
  },

  getChainsName: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.name;
        return acc;
      },
      {} as Record<ChainId, string>
    );
  },

  getChainsBadge: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.icons.badgeURL;
        return acc;
      },
      {} as Record<ChainId, string>
    );
  },

  getChainsIdByName: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[backendNetwork.name] = parseInt(backendNetwork.id, 10);
        return acc;
      },
      {} as Record<string, ChainId>
    );
  },

  getColorsForChainId: (chainId: ChainId, isDarkMode: boolean) => {
    const { backendNetworks } = get();

    const colors = backendNetworks.networks.find(chain => +chain.id === chainId)?.colors;
    if (!colors) {
      return isDarkMode ? globalColors.white : globalColors.black;
    }

    return isDarkMode ? colors.dark : colors.light;
  },

  // TODO: This should come from the backend at some point
  defaultGasSpeeds: chainId => {
    switch (chainId) {
      case ChainId.bsc:
      case ChainId.goerli:
      case ChainId.polygon:
        return [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT];
      case ChainId.gnosis:
        return [GasSpeed.NORMAL];
      default:
        return [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT, GasSpeed.CUSTOM];
    }
  },

  getChainsGasSpeeds: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = get().defaultGasSpeeds(parseInt(backendNetwork.id, 10));
        return acc;
      },
      {} as Record<ChainId, GasSpeed[]>
    );
  },

  defaultPollingInterval: chainId => {
    switch (chainId) {
      case ChainId.polygon:
        return 2_000;
      case ChainId.arbitrum:
      case ChainId.bsc:
        return 3_000;
      default:
        return 5_000;
    }
  },

  getChainsPollingInterval: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = get().defaultPollingInterval(parseInt(backendNetwork.id, 10));
        return acc;
      },
      {} as Record<ChainId, number>
    );
  },

  // TODO: This should come from the backend
  defaultSimplehashNetwork: chainId => {
    switch (chainId) {
      case ChainId.apechain:
        return 'apechain';
      case ChainId.arbitrum:
        return 'arbitrum';
      case ChainId.avalanche:
        return 'avalanche';
      case ChainId.base:
        return 'base';
      case ChainId.blast:
        return 'blast';
      case ChainId.bsc:
        return 'bsc';
      case ChainId.degen:
        return 'degen';
      case ChainId.gnosis:
        return 'gnosis';
      case ChainId.goerli:
        return 'ethereum-goerli';
      // case ChainId.gravity: // FIXME: Unsupported as of now https://docs.simplehash.com/reference/supported-chains-testnets#mainnets
      //   return 'gravity';
      // case ChainId.ink: // FIXME: Unsupported as of now https://docs.simplehash.com/reference/supported-chains-testnets#mainnets
      //   return 'ink';
      case ChainId.mainnet:
        return 'ethereum';
      case ChainId.optimism:
        return 'optimism';
      case ChainId.polygon:
        return 'polygon';
      // case ChainId.sanko: // FIXME: Unsupported as of now https://docs.simplehash.com/reference/supported-chains-testnets#mainnets
      //   return 'sanko';
      case ChainId.scroll:
        return 'scroll';
      case ChainId.zksync:
        return 'zksync-era';
      case ChainId.zora:
        return 'zora';
      case ChainId.linea:
        return 'linea';

      default:
        return '';
    }
  },

  getChainsSimplehashNetwork: () => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.reduce(
      (acc, backendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = get().defaultSimplehashNetwork(parseInt(backendNetwork.id, 10));
        return acc;
      },
      {} as Record<ChainId, string>
    );
  },

  filterChainIdsByService: servicePath => {
    const backendNetworks = get().backendNetworks;
    return backendNetworks.networks.filter(network => servicePath(network.enabledServices)).map(network => parseInt(network.id, 10));
  },

  getMeteorologySupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.meteorology.enabled);
  },

  getSwapSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.swap.enabled);
  },

  getSwapExactOutputSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.swap.swapExactOutput);
  },

  getBridgeExactOutputSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.swap.bridgeExactOutput);
  },

  getNotificationsSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.notifications.enabled);
  },

  getApprovalsSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.addys.approvals);
  },

  getTransactionsSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.addys.transactions);
  },

  getSupportedAssetsChainIds: () => {
    return get().filterChainIdsByService(services => services.addys.assets);
  },

  getSupportedPositionsChainIds: () => {
    return get().filterChainIdsByService(services => services.addys.positions);
  },

  getTokenSearchSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.tokenSearch.enabled);
  },

  getNftSupportedChainIds: () => {
    return get().filterChainIdsByService(services => services.nftProxy.enabled);
  },

  getFlashbotsSupportedChainIds: () => {
    return [ChainId.mainnet];
  },

  getShouldDefaultToFastGasChainIds: () => {
    return [ChainId.mainnet, ChainId.polygon, ChainId.goerli];
  },

  getChainGasUnits: chainId => {
    const backendNetworks = get().backendNetworks;
    const chainsGasUnits = backendNetworks.networks.reduce(
      (acc, backendNetwork: BackendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.gasUnits;
        return acc;
      },
      {} as Record<number, BackendNetwork['gasUnits']>
    );

    return (chainId ? chainsGasUnits[chainId] : undefined) || chainsGasUnits[ChainId.mainnet];
  },

  getChainDefaultRpc: chainId => {
    const defaultChains = get().getDefaultChains();
    switch (chainId) {
      case ChainId.mainnet:
        return useConnectedToAnvilStore.getState().connectedToAnvil
          ? chainAnvil.rpcUrls.default.http[0]
          : defaultChains[ChainId.mainnet].rpcUrls.default.http[0];
      default:
        return defaultChains[chainId].rpcUrls.default.http[0];
    }
  },

  setBackendNetworks: backendNetworks =>
    set(state => {
      state.backendNetworksSharedValue.value = backendNetworks;
      return {
        ...state,
        backendNetworks: backendNetworks,
      };
    }),
}));

// ------ WORKLET FUNCTIONS ------

export const getBackendChainsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return transformBackendNetworksToChains(backendNetworks.value.networks);
};

export const getSupportedChainsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  const backendChains = getBackendChainsWorklet(backendNetworks);
  return IS_TEST ? [...backendChains, chainAnvil, chainAnvilOptimism] : backendChains;
};

export const getDefaultChainsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  const supportedChains = getSupportedChainsWorklet(backendNetworks);
  return supportedChains.reduce(
    (acc, chain) => {
      acc[chain.id] = chain;
      return acc;
    },
    {} as Record<ChainId, Chain>
  );
};

export const getSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  const supportedChains = getSupportedChainsWorklet(backendNetworks);
  return supportedChains.map(chain => chain.id);
};

export const getSupportedMainnetChainsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  const supportedChains = getSupportedChainsWorklet(backendNetworks);
  return supportedChains.filter(chain => !chain.testnet);
};

export const getSupportedMainnetChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  const supportedMainnetChains = getSupportedMainnetChainsWorklet(backendNetworks);
  return supportedMainnetChains.map(chain => chain.id);
};

export const getNeedsL1SecurityFeeChainsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks
    .filter((backendNetwork: BackendNetwork) => backendNetwork.opStack)
    .map((backendNetwork: BackendNetwork) => parseInt(backendNetwork.id, 10));
};

export const getChainsNativeAssetWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.nativeAsset;
      return acc;
    },
    {} as Record<ChainId, BackendNetwork['nativeAsset']>
  );
};

export const getChainsLabelWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.label;
      return acc;
    },
    {} as Record<number, string>
  );
};

export const getChainsNameWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.name;
      return acc;
    },
    {} as Record<number, string>
  );
};

export const getChainsBadgeWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.icons.badgeURL;
      return acc;
    },
    {} as Record<ChainId, string>
  );
};

export const getChainsIdByNameWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[backendNetwork.name] = parseInt(backendNetwork.id, 10);
      return acc;
    },
    {} as Record<string, ChainId>
  );
};

export const defaultGasSpeedsWorklet = (chainId: ChainId) => {
  'worklet';
  switch (chainId) {
    case ChainId.bsc:
    case ChainId.goerli:
    case ChainId.polygon:
      return [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT];
    case ChainId.gnosis:
      return [GasSpeed.NORMAL];
    default:
      return [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT, GasSpeed.CUSTOM];
  }
};

export const getChainsGasSpeedsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultGasSpeedsWorklet(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<ChainId, GasSpeed[]>
  );
};

export const defaultPollingIntervalWorklet = (chainId: ChainId) => {
  'worklet';
  switch (chainId) {
    case ChainId.polygon:
      return 2_000;
    case ChainId.arbitrum:
    case ChainId.bsc:
      return 3_000;
    default:
      return 5_000;
  }
};

export const getChainsPollingIntervalWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultPollingIntervalWorklet(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<ChainId, number>
  );
};

export const defaultSimplehashNetworkWorklet = (chainId: ChainId) => {
  'worklet';
  switch (chainId) {
    case ChainId.apechain:
      return 'apechain';
    case ChainId.arbitrum:
      return 'arbitrum';
    case ChainId.avalanche:
      return 'avalanche';
    case ChainId.base:
      return 'base';
    case ChainId.blast:
      return 'blast';
    case ChainId.bsc:
      return 'bsc';
    case ChainId.degen:
      return 'degen';
    case ChainId.gnosis:
      return 'gnosis';
    case ChainId.goerli:
      return 'ethereum-goerli';
    case ChainId.mainnet:
      return 'ethereum';
    case ChainId.optimism:
      return 'optimism';
    case ChainId.polygon:
      return 'polygon';
    case ChainId.zora:
      return 'zora';
    default:
      return '';
  }
};

export const getChainsSimplehashNetworkWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return backendNetworks.value.networks.reduce(
    (acc, backendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultSimplehashNetworkWorklet(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<ChainId, string>
  );
};

export const filterChainIdsByServiceWorklet = (
  backendNetworks: SharedValue<BackendNetworksResponse>,
  servicePath: (services: BackendNetworkServices) => boolean
) => {
  'worklet';
  return backendNetworks.value.networks.filter(network => servicePath(network.enabledServices)).map(network => parseInt(network.id, 10));
};

export const getMeteorologySupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.meteorology.enabled);
};

export const getSwapSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.swap.enabled);
};

export const getSwapExactOutputSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.swap.swapExactOutput);
};

export const getBridgeExactOutputSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.swap.bridgeExactOutput);
};

export const getNotificationsSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.notifications.enabled);
};

export const getApprovalsSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.addys.approvals);
};

export const getTransactionsSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.addys.transactions);
};

export const getSupportedAssetsChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.addys.assets);
};

export const getSupportedPositionsChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.addys.positions);
};

export const getTokenSearchSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.tokenSearch.enabled);
};

export const getNftSupportedChainIdsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return filterChainIdsByServiceWorklet(backendNetworks, services => services.nftProxy.enabled);
};

export const getFlashbotsSupportedChainIdsWorklet = (_?: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return [ChainId.mainnet];
};

export const getShouldDefaultToFastGasChainIdsWorklet = (_?: SharedValue<BackendNetworksResponse>) => {
  'worklet';
  return [ChainId.mainnet, ChainId.polygon, ChainId.goerli];
};

export const getChainGasUnitsWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>, chainId?: ChainId) => {
  'worklet';
  const chainsGasUnits = backendNetworks.value.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.gasUnits;
      return acc;
    },
    {} as Record<number, BackendNetwork['gasUnits']>
  );

  return (chainId ? chainsGasUnits[chainId] : undefined) || chainsGasUnits[ChainId.mainnet];
};

export const getChainDefaultRpcWorklet = (backendNetworks: SharedValue<BackendNetworksResponse>, chainId: ChainId) => {
  'worklet';
  const defaultChains = getDefaultChainsWorklet(backendNetworks);
  switch (chainId) {
    case ChainId.mainnet:
      return useConnectedToAnvilStore.getState().connectedToAnvil
        ? 'http://127.0.0.1:8545'
        : defaultChains[ChainId.mainnet].rpcUrls.default.http[0];
    default:
      return defaultChains[chainId].rpcUrls.default.http[0];
  }
};
