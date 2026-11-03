import type { Address, Hex } from 'viem';

import { type EthereumAddress } from '@/entities/wallet';

export enum REGISTRATION_STEPS {
  COMMIT = 'COMMIT',
  EDIT = 'EDIT',
  REGISTER = 'REGISTER',
  RENEW = 'RENEW',
  SET_NAME = 'SET_NAME',
  WAIT_COMMIT_CONFIRMATION = 'WAIT_COMMIT_CONFIRMATION',
  WAIT_ENS_COMMITMENT = 'WAIT_ENS_COMMITMENT',
}

export enum REGISTRATION_MODES {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  RENEW = 'RENEW',
  SEARCH = 'SEARCH',
  SET_NAME = 'SET_NAME',
}

/**
 * Parameters committed onchain and retained unchanged until registration.
 */
export type EnsCommitment = {
  registrar: Address;
  owner: Address;
  /** Registration term in seconds. */
  duration: number;
  secret: Hex;
  resolver: Address;
  subregistry: Address;
  referrer: Hex;
};

export type Records = Partial<Record<string, string>>;

interface TransactionRegistrationParameters {
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
  registerTransactionHash?: string;
}

export interface RegistrationParameters extends TransactionRegistrationParameters {
  mode?: keyof typeof REGISTRATION_MODES;
  name: string;
  records?: Records;
  initialRecords?: Records;
  commitment?: EnsCommitment;
  setReverseRecord?: boolean;
}

export interface ENSRegistrations {
  [key: EthereumAddress]: {
    [ensName: string]: RegistrationParameters;
  };
}
