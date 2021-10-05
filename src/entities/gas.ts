export interface TxFee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface TxFees {
  [key: string]: {
    txFee?: TxFee;
    baseTxFee?: TxFee;
    maxTxFee?: TxFee;
  };
}

export interface SelectedGasPrice {
  estimatedTime: { amount: string; display: string };
  option: string;
  txFee: TxFee;
  value: { amount: string; display: string };
}

export interface GasFeeBaseParams {
  estimatedTime: { amount: number; display: string };
  option: string;
}

export interface GasFeeLegacyParams extends GasFeeBaseParams {
  gasPrice: { amount: number; display: string };
}

export interface GasFeeParams extends GasFeeBaseParams {
  baseFeePerGas: { amount: number; display: string; gwei: string };
  maxFeePerGas: { amount: number; display: string; gwei: string };
  priorityFeePerGas: { amount: number; display: string; gwei: string };
}

export interface EstimatedLegacyGasFees {
  [key: string]: GasFeeLegacyParams;
}

export interface EstimatedGasFees {
  [key: string]: GasFeeParams;
}
