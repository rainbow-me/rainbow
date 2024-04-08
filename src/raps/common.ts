import { MMKV } from 'react-native-mmkv';
import { RapAction, RapActionParameterMap, RapActionTypes } from './references';
import { STORAGE_IDS } from '@/model/mmkv';

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

export const swapMetadataStorage = new MMKV({
  id: STORAGE_IDS.SWAPS_METADATA_STORAGE,
});
