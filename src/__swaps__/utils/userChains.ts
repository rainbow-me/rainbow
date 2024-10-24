import {
  Chain,
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  holesky,
  optimism,
  optimismSepolia,
  polygon,
  polygonMumbai,
  zora,
  zoraSepolia,
  goerli,
  mainnet,
  sepolia,
} from 'viem/chains';

import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const chainIdMap: Record<
  ChainId.mainnet | ChainId.optimism | ChainId.polygon | ChainId.base | ChainId.bsc | ChainId.zora | ChainId.avalanche,
  ChainId[]
> = {
  [ChainId.mainnet]: [mainnet.id, goerli.id, sepolia.id, holesky.id],
  [ChainId.optimism]: [optimism.id, optimismSepolia.id],
  [ChainId.arbitrum]: [arbitrum.id, arbitrumGoerli.id, arbitrumSepolia.id],
  [ChainId.polygon]: [polygon.id, polygonMumbai.id],
  [ChainId.base]: [base.id, baseSepolia.id],
  [ChainId.bsc]: [bsc.id, bscTestnet.id],
  [ChainId.zora]: [zora.id, zoraSepolia.id],
  [ChainId.avalanche]: [avalanche.id, avalancheFuji.id],
};

export const chainLabelMap: Record<
  ChainId.mainnet | ChainId.optimism | ChainId.polygon | ChainId.base | ChainId.bsc | ChainId.zora | ChainId.avalanche,
  string[]
> = {
  [ChainId.mainnet]: [
    useBackendNetworksStore.getState().getChainsLabel()[goerli.id],
    useBackendNetworksStore.getState().getChainsLabel()[sepolia.id],
    useBackendNetworksStore.getState().getChainsLabel()[holesky.id],
  ],
  [ChainId.optimism]: [useBackendNetworksStore.getState().getChainsLabel()[optimismSepolia.id]],
  [ChainId.arbitrum]: [
    useBackendNetworksStore.getState().getChainsLabel()[arbitrumGoerli.id],
    useBackendNetworksStore.getState().getChainsLabel()[arbitrumSepolia.id],
  ],
  [ChainId.polygon]: [useBackendNetworksStore.getState().getChainsLabel()[polygonMumbai.id]],
  [ChainId.base]: [useBackendNetworksStore.getState().getChainsLabel()[baseSepolia.id]],
  [ChainId.bsc]: [useBackendNetworksStore.getState().getChainsLabel()[bscTestnet.id]],
  [ChainId.zora]: [useBackendNetworksStore.getState().getChainsLabel()[zoraSepolia.id]],
  [ChainId.avalanche]: [useBackendNetworksStore.getState().getChainsLabel()[avalancheFuji.id]],
};

export const sortNetworks = (order: ChainId[], chains: Chain[]) => {
  const allChainsOrder = order?.map(chainId => chainIdMap[chainId] || [chainId])?.flat();
  const ordered = chains.sort((a, b) => {
    const aIndex = allChainsOrder.indexOf(a.id);
    const bIndex = allChainsOrder.indexOf(b.id);
    if (aIndex === -1) return bIndex === -1 ? 0 : 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  return ordered;
};

export const filterUserNetworks = ({ userChains }: { userChains: Record<ChainId, boolean> }) => {
  const availableChains = Object.keys(userChains)
    .filter(chainId => userChains[Number(chainId)] === true)
    .map(chainId => Number(chainId));

  const allAvailableUserChains = availableChains.map(chainId => chainIdMap[chainId]).flat();

  return allAvailableUserChains;
};
