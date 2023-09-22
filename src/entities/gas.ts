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

export interface TransactionGasParamAmounts {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface LegacyTransactionGasParamAmounts {
  gasPrice: string;
}

export interface GasFeeParams {
  maxBaseFee: GasFeeParam;
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
  normal: Numberish;
  normalWait: Numberish;
  fast: Numberish;
  fastWait: Numberish;
  urgent: Numberish;
  urgentWait: Numberish;
}

export interface BlocksToConfirmationByPriorityFee {
  1: string;
  2: string;
  3: string;
  4: string;
}

export interface BlocksToConfirmationByBaseFee {
  4: string;
  8: string;
  40: string;
  120: string;
  240: string;
}

export interface BlocksToConfirmation {
  byBaseFee: BlocksToConfirmationByBaseFee;
  byPriorityFee: BlocksToConfirmationByPriorityFee;
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
    blocksToConfirmationByPriorityFee: BlocksToConfirmationByPriorityFee;
    blocksToConfirmationByBaseFee: BlocksToConfirmationByBaseFee;
    maxPriorityFeeSuggestions: MaxPriorityFeeSuggestions;
    secondsPerNewBlock: number;
  };
  meta: {
    blockNumber: number;
    provider: string;
  };
}

export interface RainbowMeteorologyLegacyData {
  data: {
    legacy: {
      fastGasPrice: string;
      proposeGasPrice: string;
      safeGasPrice: string;
    };
  };
  meta: {
    blockNumber: number;
    provider: string;
  };
}
