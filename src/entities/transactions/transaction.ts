export interface RainbowTransaction {
  balance: {
    amount: string;
    display: string;
  };
  description: string | null;
  from: string;
  gasLimit: string | null;
  gasPrice: string;
  hash: string;
  minedAt: number;
  name: string;
  native: {
    amount: string;
    display: string;
  };
  nonce: number | null;
  pending: boolean;
  protocol: TransactionProtocol;
  status: TransactionStatus;
  symbol: string;
  title: string;
  to: string;
  type: TransactionType;
}
