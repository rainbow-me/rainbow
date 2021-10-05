export interface TxFee {
  native: { value: { amount: string; display: string } };
  value: { amount: string; display: { amount: string; display: string } };
}
export interface SelectedGasPrice {
  estimatedTime: { amount: string; display: string };
  option: string;
  txFee: TxFee;
  value: { amount: string; display: string };
}

export interface GasPrices {
  [key: string]: {
    estimatedTime: { amount: number; display: string };
    gasPrice: { amount: number; display: string };
    option: any;
  };
}

export interface EIP1559GasPrices {
  [key: string]: {
    estimatedTime: { amount: number; display: string };
    option: any;
    baseFeePerGas: { amount: number; display: string; gwei: string };
    maxFeePerGas: { amount: number; display: string; gwei: string };
    priorityFeePerGas: { amount: number; display: string; gwei: string };
  };
}

export interface TxFees {
  [key: string]: {
    txFee?: TxFee;
    baseTxFee?: TxFee;
    maxTxFee?: TxFee;
  };
}
