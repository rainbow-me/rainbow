import { MMKV } from 'react-native-mmkv';
import { RapAction, RapActionParameterMap, RapActionTypes } from './references';
import { STORAGE_IDS } from '@/model/mmkv';
import { logger } from '@/logger';
import { EthereumAddress, LegacyGasFeeParamsBySpeed, LegacySelectedGasFee, Records, SelectedGasFee, GasFeeParamsBySpeed } from '@/entities';
import { REGISTRATION_MODES } from '@/helpers/ens';

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

export function createNewAction<T extends RapActionTypes>(type: T, parameters: RapActionParameterMap[T]): RapAction<T> {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };
  return newAction;
}

export function createNewRap<T extends RapActionTypes>(actions: RapAction<T>[]) {
  return {
    actions,
  };
}

export function createNewENSRap(actions: RapENSAction[]) {
  return {
    actions,
  };
}

export const swapMetadataStorage = new MMKV({
  id: STORAGE_IDS.SWAPS_METADATA_STORAGE,
});

export const createNewENSAction = (type: ENSRapActionType, parameters: ENSActionParameters): RapENSAction => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.log('[common] Creating a new action', {
    extra: {
      ...newAction,
    },
  });
  return newAction;
};
