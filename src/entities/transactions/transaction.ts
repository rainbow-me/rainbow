import { ProtocolType } from '../protocolTypes';
import { TransactionStatus } from './transactionStatus';
import { TransactionType } from './transactionType';

export interface RainbowTransaction {
  address?: string;
  balance: {
    amount: string;
    display: string;
  };
  dappName?: string;
  description: string | null;
  from: string | null;
  gasLimit?: string | null;
  gasPrice?: string;
  hash: string | null;
  minedAt: number | null;
  name: string | null;
  native: {
    amount: string;
    display: string;
  };
  nonce: number | null;
  pending: boolean;
  protocol: ProtocolType;
  sourceAmount?: string; // for purchases
  status: TransactionStatus;
  symbol: string;
  timestamp?: number; // for purchases
  title: string;
  to: string | null;
  transferId?: string; // for purchases
  type: TransactionType;
}
