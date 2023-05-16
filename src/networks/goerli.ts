import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { goerli } from '@wagmi/chains';
import { ETH_ADDRESS } from '@/references';
import config from '@/model/config';

export const GoerliNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...goerli,

  // network related data
  enabled: true,
  name: 'Goerli',
  longName: 'Goerli',
  value: Network.goerli,
  networkType: 'testnet',
  blockTimeInMs: 15_000,

  nativeCurrency: {
    ...goerli.nativeCurrency,
    address: ETH_ADDRESS,
  },

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.goerli),
  rpc: config.ethereum_goerli_rpc,
  balanceCheckerAddress: '0xf3352813b612a2d198e437691557069316b84ebe',

  // features
  features: {
    txHistory: true,

    // not sure if flashbots is being used app wide vs just swaps
    flashbots: false,
    walletconnect: true,
    swaps: false,
    nfts: false,
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
    getGasPrices: async () => null,
  },

  swaps: {
    defaultSlippage: 100,
    defaultToFastGas: true,
  },

  nfts: {},

  // design tings
  colors: {
    light: '#25292E',
    dark: '#25292E',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
