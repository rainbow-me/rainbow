import { concat } from 'lodash';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  RegisterENSActionParameters,
} from './common';
import store from '@rainbow-me/redux/store';

export const createRegisterENSRap = async (
  registerENSActionParameters: RegisterENSActionParameters
) => {
  // create unlock rap
  const { accountAddress } = store.getState().settings;

  let actions: RapAction[] = [];

  // commit rap
  const commit = createNewAction(RapActionTypes.commitENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, commit);
  // wait 60 secs rap
  const wait = createNewAction(RapActionTypes.waitENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, wait);
  // register rap
  const register = createNewAction(RapActionTypes.registerENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, register);
  // ? records rap
  const multicall = createNewAction(RapActionTypes.multicallENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, multicall);
  const setText = createNewAction(RapActionTypes.setTextENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, setText);
  // ? reverse name rap
  const setName = createNewAction(RapActionTypes.setNameENS, {
    ...registerENSActionParameters,
    ownerAddress: accountAddress,
  });
  actions = concat(actions, setName);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
