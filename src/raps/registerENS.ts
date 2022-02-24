import { concat } from 'lodash';
import {
  createNewENSAction,
  createNewRap,
  ENSActionParameters,
  RapActionTypes,
  RapENSAction,
} from './common';

export const createRegisterENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];

  const register = createNewENSAction(
    RapActionTypes.registerWithConfigENS,
    ENSActionParameters
  );
  actions = concat(actions, register);

  // ? records rap
  // WIP we don't have a formatter method yet
  // const multicall = createNewENSAction(
  //   RapActionTypes.multicallENS,
  //   ENSActionParameters
  // );
  // actions = concat(actions, multicall);

  // ? reverse name rap
  const setName = createNewENSAction(
    RapActionTypes.setNameENS,
    ENSActionParameters
  );
  actions = concat(actions, setName);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};

export const createCommitENSRap = async (
  ENSActionParameters: ENSActionParameters
) => {
  let actions: RapENSAction[] = [];
  // // commit rap
  const commit = createNewENSAction(
    RapActionTypes.commitENS,
    ENSActionParameters
  );
  actions = concat(actions, commit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
