import { RapAction, RapActionParameterMap, RapActionTypes } from './references';

export interface RapActionTransaction {
  hash: string | null;
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
