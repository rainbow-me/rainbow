import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { mainnet } from '@wagmi/chains';
import { ETH_ADDRESS } from '@/references';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getMainnetNetworkObject = (): NetworkProperties => {
  const { mainnet_enabled, mainnet_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...mainnet,

    // network related data
    enabled: mainnet_enabled,
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
    getProvider: () => getProviderForNetwork(Network.mainnet),
    rpc: () => proxyRpcEndpoint(mainnet.id),
    balanceCheckerAddress: '0x4dcf4562268dd384fe814c00fad239f06c2a0c2b',

    // features
    features: {
      txHistory: true,

      // not sure if flashbots is being used app wide vs just swaps
      flashbots: true,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: true,
      txs: mainnet_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
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
      simplehashNetwork: 'ethereum',
    },

    // design tings
    colors: {
      light: '#25292E',
      dark: '#25292E',
    },
  };
};
