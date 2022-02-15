import { concat } from 'lodash';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  RegisterENSActionParameters,
} from './common';

export const createRegisterENSRap = async (
  registerENSActionParameters: RegisterENSActionParameters
) => {
  let actions: RapAction[] = [];

  const register = createNewAction(
    RapActionTypes.registerWithConfigENS,
    registerENSActionParameters
  );
  actions = concat(actions, register);

  // ? records rap
  const multicall = createNewAction(
    RapActionTypes.multicallENS,
    registerENSActionParameters
  );
  actions = concat(actions, multicall);

  // ? reverse name rap
  const setName = createNewAction(
    RapActionTypes.setNameENS,
    registerENSActionParameters
  );
  actions = concat(actions, setName);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createCommitENSRap = async (
  registerENSActionParameters: RegisterENSActionParameters
) => {
  let actions: RapAction[] = [];
  // // commit rap
  const commit = createNewAction(
    RapActionTypes.commitENS,
    registerENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
