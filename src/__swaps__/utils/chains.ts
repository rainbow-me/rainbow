import { celo, fantom, harmonyOne, moonbeam } from 'viem/chains';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { ChainId } from '@/chains/types';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { chainsNativeAsset } from '@/chains';

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

export function isNativeAsset(address: AddressOrEth, chainId: ChainId) {
  return isLowerCaseMatch(chainsNativeAsset[chainId].address, address);
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
