import { Chain } from 'viem/chains';
import { BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { ChainId, BackendNetwork, BackendNetworkServices, chainHardhat, chainHardhatOptimism } from './types';
import { transformBackendNetworksToChains } from './utils/backendNetworks';
import { gasUtils } from '@/utils';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { IS_TEST } from '@/env';
import buildTimeNetworks from '@/references/networks.json';
import { backendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const backendNetworks = backendNetworksStore.getState().backendNetworks;

const getBackendNetworks = (): BackendNetworksResponse => {
  'worklet';
  return backendNetworks.value ?? buildTimeNetworks;
};

const getBackendChains = (): Chain[] => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return transformBackendNetworksToChains(backendNetworks.networks);
};

export const getSupportedChains = (): Chain[] => {
  'worklet';
  const backendChains = getBackendChains();
  return IS_TEST ? [...backendChains, chainHardhat, chainHardhatOptimism] : backendChains;
};

export const getDefaultChains = (): Record<ChainId, Chain> => {
  'worklet';
  const supportedChains = getSupportedChains();
  return supportedChains.reduce(
    (acc, chain) => {
      acc[chain.id] = chain;
      return acc;
    },
    {} as Record<ChainId, Chain>
  );
};

export const getSupportedChainIds = (): ChainId[] => {
  'worklet';
  return getSupportedChains().map(chain => chain.id);
};

export const getSupportedMainnetChains = (): Chain[] => {
  'worklet';
  return getSupportedChains().filter(chain => !chain.testnet);
};

export const getSupportedMainnetChainIds = (): ChainId[] => {
  'worklet';
  return getSupportedMainnetChains().map(chain => chain.id);
};

export const getNeedsL1SecurityFeeChains = (): ChainId[] => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks
    .filter((backendNetwork: BackendNetwork) => backendNetwork.opStack)
    .map((backendNetwork: BackendNetwork) => parseInt(backendNetwork.id, 10));
};

export const getChainsNativeAsset = (): Record<number, BackendNetwork['nativeAsset']> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.nativeAsset;
      return acc;
    },
    {} as Record<number, BackendNetwork['nativeAsset']>
  );
};

export const getChainsLabel = (): Record<number, string> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.label;
      return acc;
    },
    {} as Record<number, string>
  );
};

export const getChainsName = (): Record<number, string> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.name;
      return acc;
    },
    {} as Record<number, string>
  );
};

export const getChainsIdByName = (): Record<string, number> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[backendNetwork.name] = parseInt(backendNetwork.id, 10);
      return acc;
    },
    {} as Record<string, number>
  );
};

const defaultGasSpeeds = (chainId: ChainId) => {
  'worklet';
  switch (chainId) {
    case ChainId.bsc:
    case ChainId.goerli:
    case ChainId.polygon:
      return [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT];
    case ChainId.gnosis:
      return [gasUtils.NORMAL];
    default:
      return [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM];
  }
};

export const getChainsGasSpeeds = (): Record<ChainId, string[]> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultGasSpeeds(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<number, string[]>
  );
};

const defaultPollingIntervals = (chainId: ChainId) => {
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

export const getChainsSwapPollingInterval = (): Record<ChainId, number> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultPollingIntervals(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<number, number>
  );
};

const defaultSimplehashNetworks = (chainId: ChainId) => {
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

export const getChainsSimplehashNetwork = (): Record<ChainId, string> => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = defaultSimplehashNetworks(parseInt(backendNetwork.id, 10));
      return acc;
    },
    {} as Record<number, string>
  );
};

const filterChainIdsByService = (servicePath: (services: BackendNetworkServices) => boolean): number[] => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  return backendNetworks.networks
    .filter((network: BackendNetwork) => {
      const services = network?.enabledServices;
      return services && servicePath(services);
    })
    .map((network: BackendNetwork) => parseInt(network.id, 10));
};

export const meteorologySupportedChainIds = filterChainIdsByService(services => services.meteorology.enabled);

export const supportedSwapChainIds = filterChainIdsByService(services => services.swap.enabled);

export const supportedNotificationsChainIds = filterChainIdsByService(services => services.notifications.enabled);

export const supportedApprovalsChainIds = filterChainIdsByService(services => services.addys.approvals);

export const supportedTransactionsChainIds = filterChainIdsByService(services => services.addys.transactions);

export const supportedAssetsChainIds = filterChainIdsByService(services => services.addys.assets);

export const supportedPositionsChainIds = filterChainIdsByService(services => services.addys.positions);

export const supportedTokenSearchChainIds = filterChainIdsByService(services => services.tokenSearch.enabled);

export const supportedNftChainIds = filterChainIdsByService(services => services.nftProxy.enabled);

export const supportedFlashbotsChainIds = [ChainId.mainnet];

export const shouldDefaultToFastGasChainIds = [ChainId.mainnet, ChainId.polygon, ChainId.goerli];

export const getChainGasUnits = (chainId?: number): BackendNetwork['gasUnits'] => {
  'worklet';
  const backendNetworks = getBackendNetworks();
  const chainsGasUnits = backendNetworks.networks.reduce(
    (acc, backendNetwork: BackendNetwork) => {
      acc[parseInt(backendNetwork.id, 10)] = backendNetwork.gasUnits;
      return acc;
    },
    {} as Record<number, BackendNetwork['gasUnits']>
  );

  return (chainId ? chainsGasUnits[chainId] : undefined) || chainsGasUnits[ChainId.mainnet];
};

export const getChainDefaultRpc = (chainId: ChainId) => {
  'worklet';
  switch (chainId) {
    case ChainId.mainnet:
      return useConnectedToHardhatStore.getState().connectedToHardhat
        ? 'http://127.0.0.1:8545'
        : getDefaultChains()[ChainId.mainnet].rpcUrls.default.http[0];
    default:
      return getDefaultChains()[chainId].rpcUrls.default.http[0];
  }
};
