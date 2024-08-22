import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { mainnet } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { defaultChains } from './chains';

const { mainnet_enabled, mainnet_tx_enabled } = getRemoteConfig();

export const mainnetNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...mainnet,

  // network related data
  enabled: mainnet_enabled,
  name: 'Ethereum',
  longName: 'Ethereum',
  value: Network.mainnet,

  rpc: useConnectedToHardhatStore.getState().connectedToHardhat
    ? 'http://127.0.0.1:8545'
    : defaultChains[ChainId.mainnet].rpcUrls.default.http[0],

  // features
  features: {
    // not sure if flashbots is being used app wide vs just swaps
    flashbots: true,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: mainnet_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
    roundGasDisplay: true,
  },

  swaps: {
    defaultSlippage: 100,
  },

  // design tings
  colors: {
    light: '#25292E',
    dark: '#25292E',
  },
};
