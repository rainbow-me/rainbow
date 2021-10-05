export interface TxFee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}

export interface SelectedGasFee {
  estimatedTime: { amount: number; display: string };
  option: string;
  txFee: TxFee;
  maxTxFee?: TxFee;
  value: { amount: string; display: string };
  gasFeeParams:
    | {
        maxFeePerGas: number;
        maxPriorityFeePerGas: number;
      }
    | {
        gasPrice: number;
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

export interface LegacyTxFees {
  [key: string]: {
    txFee: TxFee;
  };
}

export interface TxFees {
  [key: string]: {
    baseTxFee: TxFee;
    maxTxFee: TxFee;
  };
}
