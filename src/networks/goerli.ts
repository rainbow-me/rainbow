import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { goerli } from '@wagmi/chains';
import { ETH_ADDRESS } from '@/references';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getGoerliNetworkObject = (): NetworkProperties => {
  const { goerli_enabled, goerli_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...goerli,

    // network related data
    enabled: goerli_enabled,
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
    getProvider: () => getProviderForNetwork(Network.goerli),
    rpc: () => proxyRpcEndpoint(goerli.id),
    balanceCheckerAddress: '0xf3352813b612a2d198e437691557069316b84ebe',

    // features
    features: {
      txHistory: true,

      // not sure if flashbots is being used app wide vs just swaps
      flashbots: false,
      walletconnect: false,
      swaps: false,
      nfts: false,
      pools: true,
      txs: goerli_tx_enabled,
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

    nfts: {
      simplehashNetwork: 'ethereum-goerli',
    },

    // design tings
    colors: {
      light: '#f6c343',
      dark: '#f6c343',
    },
  };
};
