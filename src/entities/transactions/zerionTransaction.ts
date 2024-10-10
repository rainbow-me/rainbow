import { ProtocolType } from '../protocolTypes';
import { ZerionAsset } from '../tokens';
import { TransactionDirection, TransactionStatus, TransactionType } from '@/entities';

interface ZerionTransactionFee {
  price: number;
  value: number;
}

interface ZerionTransactionMeta {
  action?: string | null;
  application?: string | null;
  asset?: ZerionAsset;
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
  status: TransactionStatus.pending | TransactionStatus.confirmed | TransactionStatus.failed;
  type: TransactionType;
}
