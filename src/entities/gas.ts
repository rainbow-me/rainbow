export interface TxFee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface SelectedGasFee {
  estimatedTime: { amount: number; display: string };
  option: string;
  txFee: TxFee;
  maxTxFee?: TxFee;
  gasFeeParams:
    | {
        baseFeePerGas: { amount: number; display: string; gwei: number };
        maxFeePerGas: { amount: number; display: string; gwei: number };
        maxPriorityFeePerGas: { amount: number; display: string; gwei: number };
      }
    | {
        gasPrice: { amount: number; display: string };
      };
}

export interface GasFeeBaseParams {
  estimatedTime: { amount: number; display: string };
  option: string;
}

export interface GasFeeLegacyParams extends GasFeeBaseParams {
  type?: 0;
  gasPrice: { amount: number; display: string };
}

export interface GasFeeParams extends GasFeeBaseParams {
  type?: 2;
  baseFeePerGas: { amount: number; display: string; gwei: number };
  maxFeePerGas: { amount: number; display: string; gwei: number };
  priorityFeePerGas: { amount: number; display: string; gwei: number };
}

export interface EstimatedLegacyGasFees {
  [key: string]: GasFeeLegacyParams;
}

export interface EstimatedGasFees {
  [key: string]: GasFeeParams;
}

export interface TxFees {
  [key: string]: {
    txFee: TxFee;
    maxTxFee?: TxFee;
  };
}
