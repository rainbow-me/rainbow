export enum GasSpeedOption {
  CUSTOM = 'custom',
  FAST = 'fast',
  NORMAL = 'normal',
  SLOW = 'slow',
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
