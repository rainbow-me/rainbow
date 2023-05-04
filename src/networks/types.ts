import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Chain } from '@wagmi/chains';
// network.ts
export enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  bsc = 'bsc',
}

export interface NetworkProperties extends Chain {
  // network related data
  enabled: boolean;
  name: string;
  longName: string;
  value: Network;
  networkType: 'layer1' | 'layer2' | 'testnet';
  blockTimeInMs: number;

  getProvider: Promise<StaticJsonRpcProvider>;

  // feature flags
  features: {
    txHistory: boolean;
    flashbots: boolean;
    walletconnect: boolean;
    swaps: boolean;
    nfts: boolean;
  };

  gas: {
    gasToken: string;
    speeds: string[];
    gasType: 'eip1559' | 'legacy';

    // this prob can just be blockTime
    pollingIntervalInMs: number;

    // needs types
    getGasPrices: () => any;
  };

  swaps: {
    outputBasedQuotes: boolean;
    defaultSlippage: number;
  };

  // design tings
  colors: {
    light: string;
    dark: string;
  };

  // TODO: reafactor badges to simplify code
  assets: {
    badgeSmall: string;
  };
}
