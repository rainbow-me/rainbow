import { type EthereumAddress } from '@/entities/wallet';

import { type REGISTRATION_MODES } from '../utils/helpers';

export type Records = Partial<Record<string, string>>;

export interface ENSRegistrationRecords {
  coinAddress: { key: string; address: string }[] | null;
  contenthash: string | null;
  ensAssociatedAddress: string | null;
  text: { key: string; value: string }[] | null;
}

export interface TransactionRegistrationParameters {
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
  registerTransactionHash?: string;
}

export interface RegistrationParameters extends TransactionRegistrationParameters {
  duration?: number;
  mode?: keyof typeof REGISTRATION_MODES;
  name: string;
  ownerAddress?: EthereumAddress;
  rentPrice?: string;
  records?: Records;
  initialRecords?: Records;
  salt?: string;
  setReverseRecord?: boolean;
}

export interface ENSRegistrations {
  [key: EthereumAddress]: {
    [ensName: string]: RegistrationParameters;
  };
}
