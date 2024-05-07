import { TransactionType } from '@/resources/transactions/types';
import { ProtocolType } from '../protocolTypes';
import { ZerionAsset } from '../tokens';
import { TransactionDirection } from './transactionDirection';

interface ZerionTransactionFee {
  price: number;
  value: number;
}

interface ZerionTransactionMeta {
  action?: string | null;
  application?: string | null;
  asset?: ZerionAsset;
}

enum ZerionTransactionStatus {
  confirmed = 'confirmed',
  failed = 'failed',
  pending = 'pending',
}

export interface ZerionTransactionChange {
  address_from: string | null;
  address_to: string | null;
  asset: ZerionAsset;
  direction: TransactionDirection;
  price?: number | null;
  value: number;
}

export interface ZerionTransaction {
  address_from: string | null;
  address_to: string | null;
  block_number: number;
  changes: ZerionTransactionChange[];
  contract: string | null;
  direction: TransactionDirection | null;
  fee: ZerionTransactionFee | null;
  hash: string;
  id: string;
  meta: ZerionTransactionMeta | null;
  mined_at: number;
  nonce: number | null;
  protocol: ProtocolType;
  status: ZerionTransactionStatus;
  type: TransactionType;
}
