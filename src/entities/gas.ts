type Numberish = number | string;

export interface Fee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
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

export interface GasFeeParams {
  baseFeePerGas: { amount: number; display: string; gwei: number };
  maxFeePerGas: { amount: number; display: string; gwei: number };
  priorityFeePerGas: { amount: number; display: string; gwei: number };
  option: string;
  estimatedTime: { amount: number; display: string };
}

export interface LegacyGasFeeParams {
  gasPrice: { amount: number; display: string };
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

export interface GasFeesBlockNativeData {
  blockPrices: {
    blockNumber: number;
    baseFeePerGas: number;
    estimatedTransactionCount: number;
    estimatedPrices: {
      confidence: number;
      price: number;
      maxPriorityFeePerGas: number;
      maxFeePerGas: number;
    }[];
  }[];
}
