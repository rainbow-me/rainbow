import { EthereumAddress } from '.';
import { ENS_RECORDS, ENSRegistrationRecords } from '@rainbow-me/helpers/ens';

export type Records = { [key in keyof typeof ENS_RECORDS]: string };

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
  records?: ENSRegistrationRecords;
  rentPrice: string;
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
