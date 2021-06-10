export enum GasSpeedOption {
  CUSTOM = 'custom',
  FAST = 'fast',
  NORMAL = 'normal',
  SLOW = 'slow',
}

export const GasSpeedOptions = {
  CUSTOM: 'custom',
  FAST: 'fast',
  NORMAL: 'normal',
  SLOW: 'slow',
};

export interface EtherscanPrices {
  average: number;
  avgWait: number;
  fast: number;
  fastWait: number;
  safeLow: number;
  safeLowWait: number;
}

export interface EthGasStationPrices {
  average: number;
  avgWait: number;
  fast: number;
  fastWait: number;
  fastest: number;
  fastestWait: number;
}

export interface MaticGasStationPrices {
  average: string | number;
  fast: string | number;
  fastest: string | number;
}

export interface TxFee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface GasPrice {
  estimatedTime: { amount: string; display: string };
  option: string;
  value: { amount: string; display: string };
}

export interface SelectedGasPrice extends GasPrice {
  txFee: TxFee;
}

export type TxFees = Record<GasSpeedOption, Record<string, TxFee | null>>;

export type GasPrices = Record<GasSpeedOption, GasPrice | null>;
