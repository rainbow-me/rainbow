import isEqual from 'react-fast-compare';
import { Chain } from 'viem/chains';
import { IS_TEST } from '@/env';
import { queryClient } from '@/react-query';
import buildTimeNetworks from '@/references/networks.json';
import { backendNetworksQueryKey, BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { transformBackendNetworksToChains } from '@/state/backendNetworks/utils';
import { BackendNetwork, BackendNetworkServices, chainAnvil, chainAnvilOptimism, ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { colors as globalColors } from '@/styles';
import { GasSpeed } from '@/__swaps__/types/gas';
import { time } from '@/utils';

const INITIAL_BACKEND_NETWORKS = queryClient.getQueryData<BackendNetworksResponse>(backendNetworksQueryKey()) ?? buildTimeNetworks;
const DEFAULT_PRIVATE_MEMPOOL_TIMEOUT = time.minutes(2);

export interface BackendNetworksState {
  backendNetworks: BackendNetworksResponse;

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

let lastNetworks: BackendNetworksResponse | null = null;
let storeGetter: (() => BackendNetworksResponse) | null = null;

function createSelector<T>(selectorFn: (networks: BackendNetworksResponse) => () => T): () => T {
  let cachedResult: T | undefined = undefined;
  let memoizedFn: (() => T) | null = null;

  return () => {
    if (!storeGetter) storeGetter = () => useBackendNetworksStore.getState().backendNetworks;
    const backendNetworks = storeGetter();

    if (cachedResult !== undefined && lastNetworks === backendNetworks) {
      return cachedResult;
    }

    if (!memoizedFn || lastNetworks !== backendNetworks) {
      memoizedFn = selectorFn(backendNetworks);
      lastNetworks = backendNetworks;
    }

    cachedResult = memoizedFn();
    return cachedResult;
  };
}

function createParameterizedSelector<T, Args extends unknown[]>(
  selectorFn: (networks: BackendNetworksResponse) => (...args: Args) => T
): (...args: Args) => T {
  let cachedResult: T | undefined = undefined;
  let lastArgs: Args | null = null;
  let memoizedFn: ((...args: Args) => T) | null = null;

  return (...args: Args) => {
    if (!storeGetter) storeGetter = () => useBackendNetworksStore.getState().backendNetworks;
    const backendNetworks = storeGetter();
    const argsChanged = !lastArgs || args.length !== lastArgs.length || args.some((arg, i) => arg !== lastArgs?.[i]);

    if (cachedResult !== undefined && lastNetworks === backendNetworks && !argsChanged) {
      return cachedResult;
    }

    if (!memoizedFn || lastNetworks !== backendNetworks) {
      memoizedFn = selectorFn(backendNetworks);
      lastNetworks = backendNetworks;
    }

    lastArgs = args;
    cachedResult = memoizedFn(...args);
    return cachedResult;
  };
}

export const useBackendNetworksStore = createRainbowStore<BackendNetworksState>((set, get) => ({
  backendNetworks: INITIAL_BACKEND_NETWORKS,

  getBackendChains: createSelector(networks => () => transformBackendNetworksToChains(networks.networks)),

  getSupportedChains: createSelector(networks => () => {
    const backendChains = transformBackendNetworksToChains(networks.networks);
    return IS_TEST ? [...backendChains, chainAnvil, chainAnvilOptimism] : backendChains;
  }),

  getSortedSupportedChainIds: createSelector(networks => () => {
    const chains = transformBackendNetworksToChains(networks.networks);
    const allChains = IS_TEST ? [...chains, chainAnvil, chainAnvilOptimism] : chains;
    return allChains.sort((a, b) => a.name.localeCompare(b.name)).map(c => c.id);
  }),

  getDefaultChains: createSelector(networks => () => {
    const chains = transformBackendNetworksToChains(networks.networks);
    const allChains = IS_TEST ? [...chains, chainAnvil, chainAnvilOptimism] : chains;
    return allChains.reduce(
      (acc, chain) => {
        acc[chain.id] = chain;
        return acc;
      },
      {} as Record<ChainId, Chain>
    );
  }),

  getSupportedChainIds: createSelector(networks => () => {
    const chains = transformBackendNetworksToChains(networks.networks);
    const allChains = IS_TEST ? [...chains, chainAnvil, chainAnvilOptimism] : chains;
    return allChains.map(chain => chain.id);
  }),

  getSupportedMainnetChains: createSelector(networks => () => {
    const chains = transformBackendNetworksToChains(networks.networks);
    const allChains = IS_TEST ? [...chains, chainAnvil, chainAnvilOptimism] : chains;
    return allChains.filter(chain => !chain.testnet);
  }),

  getSupportedMainnetChainIds: createSelector(networks => () => {
    const chains = transformBackendNetworksToChains(networks.networks);
    const allChains = IS_TEST ? [...chains, chainAnvil, chainAnvilOptimism] : chains;
    return allChains.filter(chain => !chain.testnet).map(chain => chain.id);
  }),

  getNeedsL1SecurityFeeChains: createSelector(
    networks => () =>
      networks.networks
        .filter((backendNetwork: BackendNetwork) => backendNetwork.opStack)
        .map((backendNetwork: BackendNetwork) => parseInt(backendNetwork.id, 10))
  ),

  getChainsNativeAsset: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[parseInt(backendNetwork.id, 10)] = backendNetwork.nativeAsset;
          return acc;
        },
        {} as Record<ChainId, BackendNetwork['nativeAsset']>
      )
  ),

  getChainsLabel: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[parseInt(backendNetwork.id, 10)] = backendNetwork.label;
          return acc;
        },
        {} as Record<ChainId, string>
      )
  ),

  getChainsPrivateMempoolTimeout: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[parseInt(backendNetwork.id, 10)] = backendNetwork.privateMempoolTimeout || DEFAULT_PRIVATE_MEMPOOL_TIMEOUT;
          return acc;
        },
        {} as Record<ChainId, number>
      )
  ),

  getChainsName: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[parseInt(backendNetwork.id, 10)] = backendNetwork.name;
          return acc;
        },
        {} as Record<ChainId, string>
      )
  ),

  getChainsBadge: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[parseInt(backendNetwork.id, 10)] = backendNetwork.icons.badgeURL;
          return acc;
        },
        {} as Record<ChainId, string>
      )
  ),

  getChainsIdByName: createSelector(
    networks => () =>
      networks.networks.reduce(
        (acc, backendNetwork) => {
          acc[backendNetwork.name] = parseInt(backendNetwork.id, 10);
          return acc;
        },
        {} as Record<string, ChainId>
      )
  ),

  getColorsForChainId: createParameterizedSelector(networks => (chainId: ChainId, isDarkMode: boolean) => {
    const colors = networks.networks.find(chain => +chain.id === chainId)?.colors;
    if (!colors) {
      return isDarkMode ? globalColors.white : globalColors.black;
    }
    return isDarkMode ? colors.dark : colors.light;
  }),

  defaultGasSpeeds: createParameterizedSelector(() => (chainId: ChainId) => {
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
  }),

  getChainsGasSpeeds: createSelector(networks => () => {
    return networks.networks.reduce(
      (acc, backendNetwork) => {
        const chainId = parseInt(backendNetwork.id, 10);
        switch (chainId) {
          case ChainId.bsc:
          case ChainId.goerli:
          case ChainId.polygon:
            acc[chainId] = [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT];
            break;
          case ChainId.gnosis:
            acc[chainId] = [GasSpeed.NORMAL];
            break;
          default:
            acc[chainId] = [GasSpeed.NORMAL, GasSpeed.FAST, GasSpeed.URGENT, GasSpeed.CUSTOM];
        }
        return acc;
      },
      {} as Record<ChainId, GasSpeed[]>
    );
  }),

  defaultPollingInterval: createParameterizedSelector(() => (chainId: ChainId) => {
    switch (chainId) {
      case ChainId.polygon:
        return 2_000;
      case ChainId.arbitrum:
      case ChainId.bsc:
        return 3_000;
      default:
        return 5_000;
    }
  }),

  getChainsPollingInterval: createSelector(networks => () => {
    return networks.networks.reduce(
      (acc, backendNetwork) => {
        const chainId = parseInt(backendNetwork.id, 10);
        switch (chainId) {
          case ChainId.polygon:
            acc[chainId] = 2_000;
            break;
          case ChainId.arbitrum:
          case ChainId.bsc:
            acc[chainId] = 3_000;
            break;
          default:
            acc[chainId] = 5_000;
        }
        return acc;
      },
      {} as Record<ChainId, number>
    );
  }),

  defaultSimplehashNetwork: createParameterizedSelector(() => (chainId: ChainId) => {
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
  }),

  getChainsSimplehashNetwork: createSelector(networks => () => {
    return networks.networks.reduce(
      (acc, backendNetwork) => {
        const chainId = parseInt(backendNetwork.id, 10);
        acc[chainId] = (() => {
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
        })();
        return acc;
      },
      {} as Record<ChainId, string>
    );
  }),

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

  getChainGasUnits: createParameterizedSelector(networks => (chainId?: ChainId) => {
    const chainsGasUnits = networks.networks.reduce(
      (acc, backendNetwork: BackendNetwork) => {
        acc[parseInt(backendNetwork.id, 10)] = backendNetwork.gasUnits;
        return acc;
      },
      {} as Record<number, BackendNetwork['gasUnits']>
    );

    return (chainId ? chainsGasUnits[chainId] : undefined) || chainsGasUnits[ChainId.mainnet];
  }),

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
      if (isEqual(state.backendNetworks, backendNetworks)) return state;
      return { backendNetworks };
    }),
}));
