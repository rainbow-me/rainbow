import { EthereumAddress } from '.';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';

export type Records = { [key in keyof typeof ENS_RECORDS]: string };

export interface ENSRegistrationState {
  currentRegistrationName: string;
  registrations: {
    [key: EthereumAddress]: {
      [key: string]: {
        name: string;
        duration: number;
        records: Records;
      };
    };
  };
}
