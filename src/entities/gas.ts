type Numberish = number | string;

export interface Fee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface GasFeeParam {
  amount: number;
  display: string;
  gwei: number;
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
  baseFeePerGas: GasFeeParam;
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
