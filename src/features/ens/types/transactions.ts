import type { Address, Hex } from 'viem';

import type { EnsToken } from '../data/registry';

export type EnsAction = {
  type: 'transfer';
  name: string;
  token: EnsToken;
  toAddress: string;
  clearRecords: boolean;
  setAddress: boolean;
  transferControl: boolean;
};

export type EnsTransaction = {
  to: Address;
  data: Hex;
  /** Identifies transaction callbacks and steps that require confirmation. */
  operation: 'records' | 'reclaim';
};

export type EnsTransferAction = Extract<EnsAction, { type: 'transfer' }>;
