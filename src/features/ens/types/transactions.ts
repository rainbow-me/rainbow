import type { Address, Hex } from 'viem';

import type { EnsToken } from '../data/registry';
import type { EnsCommitment, Records } from './registration';

export type EnsAction = { name: string } & (
  | { type: 'commit'; commitment: EnsCommitment }
  | { type: 'register'; commitment: EnsCommitment; records: Records; setReverseRecord: boolean }
  | { type: 'renew'; duration: number }
  | { type: 'records'; records: Records; setReverseRecord?: boolean }
  | { type: 'primary' }
  | { type: 'transfer'; token: EnsToken; toAddress: string; clearRecords: boolean; setAddress: boolean; transferControl: boolean }
);

export type EnsTransaction = {
  to: Address;
  data: Hex;
  /** Identifies transaction callbacks and steps that require confirmation. */
  operation: 'approve' | 'deployResolver' | 'commit' | 'register' | 'renew' | 'records' | 'primary' | 'reclaim';
};

export type EnsTransferAction = Extract<EnsAction, { type: 'transfer' }>;
