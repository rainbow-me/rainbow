export enum GasSpeed {
  URGENT = 'urgent',
  FAST = 'fast',
  NORMAL = 'normal',
  CUSTOM = 'custom',
}

export interface GasFeeParam {
  amount: string;
  display: string;
  gwei: string;
}

export interface TransactionLegacyGasParams {
  gasPrice: string;
}

export interface GasFeeLegacyParams {
  gasPrice: GasFeeParam;
  option: GasSpeed;
  estimatedTime: { amount: number; display: string };
  display: string;
  transactionGasParams: TransactionLegacyGasParams;
  gasFee: { amount: string; display: string };
}

export type GasFeeLegacyParamsBySpeed = {
  [key in GasSpeed]: GasFeeLegacyParams;
};

export interface TransactionGasParams {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

export interface GasFeeParams {
  maxBaseFee: GasFeeParam;
  maxPriorityFeePerGas: GasFeeParam;
  option: GasSpeed;
  estimatedTime: { amount: number; display: string };
  display: string;
  transactionGasParams: TransactionGasParams;
  gasFee: { amount: string; display: string };
}

export type GasFeeParamsBySpeed = {
  [key in GasSpeed]: GasFeeParams;
};

export interface BlocksToConfirmationByPriorityFee {
  [priorityFee: string]: string;
}

export interface BlocksToConfirmationByBaseFee {
  [baseFee: string]: string;
}

export interface BlocksToConfirmation {
  byBaseFee: BlocksToConfirmationByBaseFee;
  byPriorityFee: BlocksToConfirmationByPriorityFee;
}
