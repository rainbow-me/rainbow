import { EthereumAddress } from '.';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export type Records = { [key in keyof typeof ENS_RECORDS]: string };

export interface RegistrationParameters {
  name: string;
  duration: number;
  records: Records;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  salt?: string;
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
