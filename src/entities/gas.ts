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
  average: string;
  avgWait: string | number;
  fast: string;
  fastWait: string | number;
  safeLow: string;
  safeLowWait: string | number;
}

export interface EthGasStationPrices {
  average: string | number;
  avgWait: string | number;
  fast: string | number;
  fastWait: string | number;
  fastest: string | number;
  fastestWait: string | number;
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

export type TxFees = Record<GasSpeedOption, Record<string, TxFee>>;

export type GasPrices = Record<GasSpeedOption, GasPrice | null>;
