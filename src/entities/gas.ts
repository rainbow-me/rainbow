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
