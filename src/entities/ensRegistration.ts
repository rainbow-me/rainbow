import { EthereumAddress } from '.';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export type Records = { [key in keyof typeof ENS_RECORDS]: string };

export interface ENSRegistrationRecords {
  coinAddress: { key: string; address: string }[] | null;
  contentHash: string | null;
  ensAssociatedAddress: string | null;
  text: { key: string; value: string }[] | null;
}

export interface CommitRegistrationParameters {
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
}

export interface RegistrationParameters {
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
  duration: number;
  name: string;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  records?: ENSRegistrationRecords;
  salt: string;
  setReverseRecord?: boolean;
}

export interface ENSRegistrationState {
  currentRegistrationName: string;
  registrations: {
    [key: EthereumAddress]: {
      [ensName: string]: RegistrationParameters;
    };
  };
}
