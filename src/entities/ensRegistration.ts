import { EthereumAddress } from '.';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export type Records = { [value in keyof typeof ENS_RECORDS]?: string };

export interface ENSRegistrationRecords {
  coinAddress: { key: string; address: string }[] | null;
  contentHash: string | null;
  ensAssociatedAddress: string | null;
  text: { key: string; value: string }[] | null;
}

export interface TransactionRegistrationParameters {
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
  registerTransactionHash?: number;
}

export interface RegistrationParameters
  extends TransactionRegistrationParameters {
  duration: number;
  mode?: 'create' | 'edit';
  name: string;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  records?: Records;
  initialRecords?: Records;
  changedRecords?: Records;
  salt: string;
  setReverseRecord?: boolean;
}

export interface ENSRegistrations {
  [key: EthereumAddress]: {
    [ensName: string]: RegistrationParameters;
  };
}

export interface ENSRegistrationState {
  currentRegistrationName: string;
  registrations: ENSRegistrations;
}
