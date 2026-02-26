import { logger } from '@/logger';
import type { EthereumAddress } from '@/entities/wallet';
import type { LegacyGasFeeParamsBySpeed, LegacySelectedGasFee, SelectedGasFee, GasFeeParamsBySpeed } from '@/entities/gas';
import type { Records } from '../types/ensRegistration';
import { type REGISTRATION_MODES } from '../utils/helpers';

export enum ENSRapActionType {
  commitENS = 'commitENS',
  registerENS = 'registerENS',
  multicallENS = 'multicallENS',
  renewENS = 'renewENS',
  setAddrENS = 'setAddrENS',
  reclaimENS = 'reclaimENS',
  setContenthashENS = 'setContenthashENS',
  setTextENS = 'setTextENS',
  setNameENS = 'setNameENS',
  setRecordsENS = 'setRecordsENS',
  transferENS = 'transferENS',
  registerWithConfigENS = 'registerWithConfigENS',
}

export interface ENSRap {
  actions: RapENSAction[];
}

export interface ENSActionParameters {
  duration: number;
  nonce?: number;
  name: string;
  rentPrice: string;
  ownerAddress: string;
  toAddress?: string;
  salt: string;
  records?: Records;
  setReverseRecord?: boolean;
  resolverAddress?: EthereumAddress;
  clearRecords?: boolean;
  setAddress?: boolean;
  transferControl?: boolean;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  mode?: keyof typeof REGISTRATION_MODES;
}

export interface RapENSActionParameters {
  duration: number;
  name: string;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  records?: Records;
  salt: string;
  toAddress?: string;
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  mode?: keyof typeof REGISTRATION_MODES;
}

export interface RapActionTransaction {
  hash: string | null;
}

export interface RapENSAction {
  parameters: RapENSActionParameters;
  transaction: RapActionTransaction;
  type: ENSRapActionType;
}

export function createNewENSRap(actions: RapENSAction[]) {
  return {
    actions,
  };
}

export const createNewENSAction = (type: ENSRapActionType, parameters: ENSActionParameters): RapENSAction => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.debug('[raps/common]: Creating a new action', {
    extra: {
      ...newAction,
    },
  });
  return newAction;
};
