type Numberish = number | string;

export interface Fee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface GasFeeParam {
  amount: string;
  display: string;
  gwei: string;
}

export interface SelectedGasFee {
  estimatedTime: { amount: number; display: string };
  option: string;
  gasFee: GasFee;
  gasFeeParams: GasFeeParams;
}

export interface LegacySelectedGasFee {
  estimatedTime: { amount: number; display: string };
  option: string;
  gasFee: LegacyGasFee;
  gasFeeParams: LegacyGasFeeParams;
}

export interface TransactionGasParams {
  maxFeePerGas: GasFeeParam;
  maxPriorityFeePerGas: GasFeeParam;
}

export interface LegacyTransactionGasParams {
  gasPrice: GasFeeParam;
}

export interface GasFeeParams {
  maxFeePerGas: GasFeeParam;
  maxPriorityFeePerGas: GasFeeParam;
  option: string;
  estimatedTime: { amount: number; display: string };
}

export interface LegacyGasFeeParams {
  gasPrice: GasFeeParam;
  option: string;
  estimatedTime: { amount: number; display: string };
}

export interface LegacyGasFee {
  estimatedFee: Fee;
}

export interface GasFee extends LegacyGasFee {
  maxFee: Fee;
}

export interface GasFeeParamsBySpeed {
  [key: string]: GasFeeParams;
}

export interface LegacyGasFeeParamsBySpeed {
  [key: string]: LegacyGasFeeParams;
}

export interface GasFeesBySpeed {
  [key: string]: GasFee;
}

export interface LegacyGasFeesBySpeed {
  [key: string]: LegacyGasFee;
}

export interface CurrentBlockParams {
  baseFeePerGas: GasFeeParam;
  trend: number;
}

// API

export interface GasPricesAPIData {
  average: Numberish;
  avgWait: Numberish;
  fast: Numberish;
  fastWait: Numberish;
  safeLow: Numberish;
  safeLowWait: Numberish;
  fastest: Numberish;
  fastestWait: Numberish;
}

export interface GasFeesPolygonGasStationData {
  status: string;
  message: string;
  result: {
    LastBlock: string;
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
    UsdPrice: string;
  };
}

export interface ConfirmationTimeByPriorityFee {
  15: string;
  30: string;
  45: string;
  60: string;
}

export interface ConfirmationBlocksByPriorityFee {
  1: string;
  2: string;
  3: string;
  4: string;
}

export interface ConfirmationBlocksByBaseFee {
  4: string;
  8: string;
  40: string;
  120: string;
  240: string;
}

export interface ConfirmationBlocks {
  confirmationBlocksByBaseFee: ConfirmationBlocksByBaseFee;
  confirmationBlocksByPriorityFee: ConfirmationBlocksByPriorityFee;
}

export interface MaxPriorityFeeSuggestions {
  fast: string;
  normal: string;
  urgent: string;
}

export interface RainbowMeteorologyData {
  data: {
    currentBaseFee: string;
    baseFeeSuggestion: string;
    baseFeeTrend: number;
    confirmationTimeByPriorityFee: ConfirmationTimeByPriorityFee;
    confirmationBlocks: ConfirmationBlocks;
    confirmationBlocksByPriorityFee: ConfirmationBlocksByPriorityFee;
    confirmationBlocksByBaseFee: ConfirmationBlocksByBaseFee;
    maxPriorityFeeSuggestions: MaxPriorityFeeSuggestions;
  };
  meta: {
    blockNumber: number;
    provider: string;
  };
}
