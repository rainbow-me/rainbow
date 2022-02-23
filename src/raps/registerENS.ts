import { concat } from 'lodash';
import {
  createNewENSAction,
  createNewRap,
  RapActionTypes,
  RapENSAction,
  RegisterENSActionParameters,
} from './common';

export const createRegisterENSRap = async (
  registerENSActionParameters: RegisterENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const register = createNewENSAction(
    RapActionTypes.registerWithConfigENS,
    registerENSActionParameters
  );
  actions = concat(actions, register);

  // ? records rap
  // WIP we don't have a formatter method yet
  // const multicall = createNewENSAction(
  //   RapActionTypes.multicallENS,
  //   registerENSActionParameters
  // );
  // actions = concat(actions, multicall);

  // ? reverse name rap
  const setName = createNewENSAction(
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
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.commitENS,
    registerENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
