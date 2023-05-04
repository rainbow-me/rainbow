import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { mainnet } from '@wagmi/chains';
import { ETH_ADDRESS } from '@/references';

export const MainnetNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...mainnet,

  // network related data
  enabled: true,
  name: 'Ethereum',
  longName: 'Ethereum',
  value: Network.mainnet,
  networkType: 'layer1',
  blockTimeInMs: 15_000,

  nativeCurrency: {
    ...mainnet.nativeCurrency,
    address: ETH_ADDRESS,
  },

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.mainnet),

  // features
  features: {
    txHistory: true,

    // not sure if flashbots is being used app wide vs just swaps
    flashbots: true,
    walletconnect: true,
    swaps: true,
    nfts: true,
    savings: true,
    pools: true,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.CUSTOM],
    gasType: 'eip1559',
    roundGasDisplay: true,

    // this prob can just be blockTime
    pollingIntervalInMs: 5_000,

    // needs more research
    getGasPrices: () => 'tmp',
  },

  swaps: {
    defaultSlippage: 100,
    defaultToFastGas: true,
  },

  // design tings
  colors: {
    light: '#25292E',
    dark: '#25292E',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
