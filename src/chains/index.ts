import { Chain } from 'viem/chains';
import { queryClient } from '@/react-query';
import { backendNetworksQueryKey, BackendNetworksResponse } from '@/resources/metadata/backendNetworks';
import { ChainId, BackendNetwork, BackendNetworkServices, chainHardhat, chainHardhatOptimism } from './types';
import { transformBackendNetworksToChains } from './utils/backendNetworks';
import { gasUtils } from '@/utils';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { IS_TEST } from '@/env';
import buildTimeNetworks from '@/references/networks.json';

// NOTE: Prefer runtime data from backendNetworksQueryKey, but fallback to buildTimeNetworks if needed
const backendNetworks = queryClient.getQueryData<BackendNetworksResponse>(backendNetworksQueryKey()) ?? buildTimeNetworks;

const BACKEND_CHAINS = transformBackendNetworksToChains(backendNetworks.networks);

export const SUPPORTED_CHAINS: Chain[] = IS_TEST ? [...BACKEND_CHAINS, chainHardhat, chainHardhatOptimism] : BACKEND_CHAINS;

export const SUPPORTED_CHAIN_IDS_ALPHABETICAL = SUPPORTED_CHAINS.sort((a, b) => a.name.localeCompare(b.name)).map(c => c.id);

export const defaultChains: Record<ChainId, Chain> = SUPPORTED_CHAINS.reduce(
  (acc, chain) => {
    acc[chain.id] = chain;
    return acc;
  },
  {} as Record<ChainId, Chain>
);

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(chain => chain.id);

export const SUPPORTED_MAINNET_CHAINS: Chain[] = SUPPORTED_CHAINS.filter(chain => !chain.testnet);

export const SUPPORTED_MAINNET_CHAIN_IDS: ChainId[] = SUPPORTED_MAINNET_CHAINS.map(chain => chain.id);

export const needsL1SecurityFeeChains = backendNetworks.networks
  .filter((backendNetwork: BackendNetwork) => backendNetwork.opStack)
  .map((backendNetwork: BackendNetwork) => parseInt(backendNetwork.id, 10));

export const chainsNativeAsset: Record<number, BackendNetwork['nativeAsset']> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = backendNetwork.nativeAsset;
    return acc;
  },
  {} as Record<number, BackendNetwork['nativeAsset']>
);

export const chainsLabel: Record<number, string> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = backendNetwork.label;
    return acc;
  },
  {} as Record<number, string>
);

export const chainsName: Record<number, string> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = backendNetwork.name;
    return acc;
  },
  {} as Record<number, string>
);

export const chainsIdByName: Record<string, number> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[backendNetwork.name] = parseInt(backendNetwork.id, 10);
    return acc;
  },
  {} as Record<string, number>
);

const defaultGasSpeeds = (chainId: ChainId) => {
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

export const chainsGasSpeeds: Record<ChainId, string[]> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = defaultGasSpeeds(parseInt(backendNetwork.id, 10));
    return acc;
  },
  {} as Record<number, string[]>
);

const defaultPollingIntervals = (chainId: ChainId) => {
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

export const chainsSwapPollingInterval: Record<ChainId, number> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = defaultPollingIntervals(parseInt(backendNetwork.id, 10));
    return acc;
  },
  {} as Record<number, number>
);

const defaultSimplehashNetworks = (chainId: ChainId) => {
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

export const chainsSimplehashNetwork: Record<ChainId, string> = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = defaultSimplehashNetworks(parseInt(backendNetwork.id, 10));
    return acc;
  },
  {} as Record<number, string>
);

const filterChainIdsByService = (servicePath: (services: BackendNetworkServices) => boolean): number[] => {
  return backendNetworks.networks
    .filter((network: BackendNetwork) => {
      const services = network?.enabledServices;
      return services && servicePath(services);
    })
    .map((network: BackendNetwork) => parseInt(network.id, 10));
};

export const meteorologySupportedChainIds = filterChainIdsByService(services => services.meteorology.enabled);

export const supportedSwapChainIds = filterChainIdsByService(services => services.swap.enabled);

export const supportedSwapExactOutputChainIds = filterChainIdsByService(services => services.swap.swapExactOutput);

export const supportedBridgeExactOutputChainIds = filterChainIdsByService(services => services.swap.bridgeExactOutput);

export const supportedNotificationsChainIds = filterChainIdsByService(services => services.notifications.enabled);

export const supportedApprovalsChainIds = filterChainIdsByService(services => services.addys.approvals);

export const supportedTransactionsChainIds = filterChainIdsByService(services => services.addys.transactions);

export const supportedAssetsChainIds = filterChainIdsByService(services => services.addys.assets);

export const supportedPositionsChainIds = filterChainIdsByService(services => services.addys.positions);

export const supportedTokenSearchChainIds = filterChainIdsByService(services => services.tokenSearch.enabled);

export const supportedNftChainIds = filterChainIdsByService(services => services.nftProxy.enabled);

export const supportedFlashbotsChainIds = [ChainId.mainnet];

export const shouldDefaultToFastGasChainIds = [ChainId.mainnet, ChainId.polygon, ChainId.goerli];

const chainsGasUnits = backendNetworks.networks.reduce(
  (acc, backendNetwork: BackendNetwork) => {
    acc[parseInt(backendNetwork.id, 10)] = backendNetwork.gasUnits;
    return acc;
  },
  {} as Record<number, BackendNetwork['gasUnits']>
);

export const getChainGasUnits = (chainId?: number) => {
  return (chainId ? chainsGasUnits[chainId] : undefined) || chainsGasUnits[ChainId.mainnet];
};

export const getChainDefaultRpc = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.mainnet:
      return useConnectedToHardhatStore.getState().connectedToHardhat
        ? 'http://127.0.0.1:8545'
        : defaultChains[ChainId.mainnet].rpcUrls.default.http[0];
    default:
      return defaultChains[chainId].rpcUrls.default.http[0];
  }
};
