import { EthereumAddress } from '.';
import { ENS_RECORDS, ENSRegistrationRecords } from '@rainbow-me/helpers/ens';

export type Records = { [key in keyof typeof ENS_RECORDS]: string };

export interface RegistrationParameters {
  name: string;
  duration: number;
  records: ENSRegistrationRecords;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  salt?: string;
  setReverseRecord?: boolean;
  commitTransactionHash?: string;
  commitTransactionConfirmedAt?: number;
}

export interface ENSRegistrationState {
  currentRegistrationName: string;
  registrations: {
    [key: EthereumAddress]: {
      [ensName: string]: RegistrationParameters;
    };
  };
}
