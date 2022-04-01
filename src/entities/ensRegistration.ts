import { EthereumAddress } from '.';
import { ENS_RECORDS, REGISTRATION_MODES } from '@rainbow-me/helpers/ens';

export type Records = { [key in ENS_RECORDS]?: string };

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
  mode?: keyof typeof REGISTRATION_MODES;
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
