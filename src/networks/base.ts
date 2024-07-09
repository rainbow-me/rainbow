import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { base } from '@wagmi/chains';
import { BASE_ETH_ADDRESS } from '@/references';
import { getBaseGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getBaseNetworkObject = (): NetworkProperties => {
  const { base_enabled, base_tx_enabled, op_chains_enabled, op_chains_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...base,

    // network related data
    enabled: base_enabled && op_chains_enabled,
    name: 'Base',
    longName: 'Base',
    value: Network.base,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...base.nativeCurrency,
      address: BASE_ETH_ADDRESS,
    },

    rpc: () => proxyRpcEndpoint(base.id),
    getProvider: () => getProviderForNetwork(Network.base),
    balanceCheckerAddress: '0x1C8cFdE3Ba6eFc4FF8Dd5C93044B9A690b6CFf36',

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: base_tx_enabled && op_chains_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,
      OptimismTxFee: true,

      // this prob can just be blockTime,
      pollingIntervalInMs: 5_000,

      getGasPrices: getBaseGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: { simplehashNetwork: 'base' },

    // design tings
    colors: {
      light: '#0052FF',
      dark: '#3979FF',
    },
  };
};
