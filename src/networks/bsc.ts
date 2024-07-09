import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { bsc } from '@wagmi/chains';
import { BNB_BSC_ADDRESS, BNB_MAINNET_ADDRESS } from '@/references';
import { getBscGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getBSCNetworkObject = (): NetworkProperties => {
  const { bsc_enabled, bsc_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...bsc,

    // network related data
    enabled: bsc_enabled,
    name: 'BSC',
    longName: 'Binance Smart Chain',
    value: Network.bsc,
    networkType: 'layer2',
    blockTimeInMs: 3_000,

    nativeCurrency: {
      ...bsc.nativeCurrency,
      address: BNB_BSC_ADDRESS,
      mainnetAddress: BNB_MAINNET_ADDRESS,
    },

    // this should be refactored to have less deps
    rpc: () => proxyRpcEndpoint(bsc.id),
    getProvider: () => getProviderForNetwork(Network.bsc),
    balanceCheckerAddress: '0x400A9f1Bb1Db80643C33710C2232A0D74EF5CFf1',

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: bsc_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

      // ?
      gasType: 'legacy',
      roundGasDisplay: false,

      // this prob can just be blockTime
      pollingIntervalInMs: 3_000,

      // needs more research
      getGasPrices: getBscGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: {
      simplehashNetwork: 'bsc',
    },

    // design tings
    colors: {
      light: '#8247E5',
      dark: '#F0B90B',
    },
  };
};
