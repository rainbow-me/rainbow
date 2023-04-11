import { StaticJsonRpcProvider } from '@ethersproject/providers';

// network.ts
export enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  bsc = 'bsc',
}

export interface NetworkProperties {
  // network related data
  enabled: boolean;
  name: string;
  longName: string;
  value: Network;
  networkType: 'mainnet' | 'layer2' | 'testnet';
  blockTimeInMs: number;
  blockExplorerUrl: string;

  getProvider: Promise<StaticJsonRpcProvider>;

  // features
  txHistoryEnabled: boolean;
  flashbotsEnabled: boolean;
  walletconnectEnabled: boolean;

  gas: {
    gasToken: string;
    speeds: string[];
    gasType: 'eip1559' | 'legacy';

    // this prob can just be blockTime
    pollingIntervalInMs: number;

    // needs types
    getGasPrices: () => any;
  };

  nfts: {
    enabled: boolean;
  };

  swaps: {
    enabled: boolean;
    outputBasedQuotes: boolean;
    defaultSlippage: number;
  };

  // design tings

  colors: {
    light: string;
    dark: string;
  };

  // could be component or path to asset
  assets: {
    badgeSmall: string;
  };
}
