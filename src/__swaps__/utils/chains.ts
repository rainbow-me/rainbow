import { celo, fantom, harmonyOne, moonbeam } from 'viem/chains';
import { NATIVE_ASSETS_PER_CHAIN } from '@/references';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { ChainId, ChainName, ChainNameDisplay, chainIdToNameMapping, chainNameToIdMapping } from '@/__swaps__/types/chains';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';

// @ts-expect-error Property '[ChainId.hardhat]' is missing
export const customChainIdsToAssetNames: Record<ChainId, string> = {
  42170: 'arbitrumnova',
  1313161554: 'aurora',
  43114: 'avalanchex',
  81457: 'blast',
  168587773: 'blastsepolia',
  288: 'boba',
  42220: 'celo',
  61: 'classic',
  25: 'cronos',
  2000: 'dogechain',
  250: 'fantom',
  314: 'filecoin',
  1666600000: 'harmony',
  13371: 'immutablezkevm',
  2222: 'kavaevm',
  8217: 'klaytn',
  59144: 'linea',
  957: 'lyra',
  169: 'manta',
  5000: 'mantle',
  1088: 'metis',
  34443: 'mode',
  1284: 'moonbeam',
  7700: 'nativecanto',
  204: 'opbnb',
  11297108109: 'palm',
  424: 'pgn',
  1101: 'polygonzkevm',
  369: 'pulsechain',
  1380012617: 'rari',
  1918988905: 'raritestnet',
  17001: 'redstoneholesky',
  534352: 'scroll',
  100: 'xdai',
  324: 'zksync',
};

export const getChainName = ({ chainId }: { chainId: number }) => {
  const network = getNetworkFromChainId(chainId);
  return ChainNameDisplay[chainId] || network;
};

/**
 * @desc Checks if the given chain is a Layer 2.
 * @param chain The chain name to check.
 * @return Whether or not the chain is an L2 network.
 */
export const isL2Chain = (chain: ChainName | ChainId): boolean => {
  switch (chain) {
    case ChainName.arbitrum:
    case ChainName.base:
    case ChainName.bsc:
    case ChainName.optimism:
    case ChainName.polygon:
    case ChainName.zora:
    case ChainName.avalanche:
    case ChainId.arbitrum:
    case ChainId.base:
    case ChainId.bsc:
    case ChainId.optimism:
    case ChainId.polygon:
    case ChainId.zora:
    case ChainId.avalanche:
      return true;
    default:
      return false;
  }
};

export function isNativeAsset(address: AddressOrEth, chainId: ChainId) {
  return isLowerCaseMatch(NATIVE_ASSETS_PER_CHAIN[chainId], address);
}

export function chainIdFromChainName(chainName: ChainName) {
  return chainNameToIdMapping[chainName];
}

export function chainNameForChainIdWithMainnetSubstitution(chainId: ChainId) {
  if (chainId === ChainId.mainnet) {
    return 'ethereum';
  }
  return chainIdToNameMapping[chainId];
}

export function chainNameFromChainId(chainId: ChainId): ChainName {
  return chainIdToNameMapping[chainId];
}

export function chainNameFromChainIdWorklet(chainId: ChainId): ChainName {
  'worklet';
  return chainIdToNameMapping[chainId];
}

export const chainIdToUse = (connectedToHardhat: boolean, connectedToHardhatOp: boolean, activeSessionChainId: number) => {
  if (connectedToHardhat) {
    return ChainId.hardhat;
  }
  if (connectedToHardhatOp) {
    return ChainId.hardhatOptimism;
  }
  return activeSessionChainId;
};

export const deriveChainIdByHostname = (hostname: string) => {
  switch (hostname) {
    case 'etherscan.io':
      return ChainId.mainnet;
    case 'arbiscan.io':
      return ChainId.arbitrum;
    case 'explorer-mumbai.maticvigil.com':
    case 'explorer-mumbai.matic.today':
    case 'mumbai.polygonscan.com':
      return ChainId.polygonMumbai;
    case 'polygonscan.com':
      return ChainId.polygon;
    case 'optimistic.etherscan.io':
      return ChainId.optimism;
    case 'bscscan.com':
      return ChainId.bsc;
    case 'ftmscan.com':
      return fantom.id;
    case 'explorer.celo.org':
      return celo.id;
    case 'explorer.harmony.one':
      return harmonyOne.id;
    case 'explorer.avax.network':
    case 'subnets.avax.network':
    case 'snowtrace.io':
      return ChainId.avalanche;
    case 'subnets-test.avax.network':
    case 'testnet.snowtrace.io':
      return ChainId.avalancheFuji;
    case 'moonscan.io':
      return moonbeam.id;
    case 'explorer.holesky.redstone.xyz':
      return 17001;
    case 'blastscan.io':
      return ChainId.blast;
    case 'testnet.blastscan.io':
      return 168587773;
    default:
      return ChainId.mainnet;
  }
};
