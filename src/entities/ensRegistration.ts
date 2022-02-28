import { EthereumAddress } from '.';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export type Records = {
  [key in keyof typeof ENS_RECORDS]?: string | undefined;
};

export interface RegistrationParameters {
  mode: 'create' | 'edit';
  name: string;
  duration: number;
  // If the registration is in "edit" mode, this is the records they already have
  existingRecords: Records;
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
