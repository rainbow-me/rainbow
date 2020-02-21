import { rapsAddOrUpdate } from '../redux/raps';
import unlock from './unlock';
import swap from './swap';
import store from '../redux/store';

const NOOP = () => undefined;

export const RapActionTypes = {
  depositCompound: 'depositCompound',
  swap: 'swap',
  unlock: 'unlock',
  withdrawCompound: 'withdrawCompound',
};

const findActionByType = type => {
  switch (type) {
    case RapActionTypes.unlock:
      return unlock;
    case RapActionTypes.swap:
      return swap;
    default:
      return NOOP;
  }
};

export const executeRap = async (wallet, rap) => {
  const { actions } = rap;
  console.log('[common - executing rap]: actions', actions);
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const { parameters, type } = action;
    const actionPromise = findActionByType(type);
    console.log(
      '[common - executing rapp inner] action promise',
      actionPromise
    );
    try {
      console.log(
        '[common - executing rap inner] running the function with index',
        index
      );
      await actionPromise(wallet, rap, index, parameters);
    } catch (error) {
      console.log('[common - executing rap inner] error running action', error);
      break;
    }
  }
  console.log('[common - executing rap] finished execute rap function');
};

export const createNewRap = (actions, callback) => {
  const { dispatch } = store;
  const now = new Date().getTime();
  const currentRap = {
    actions,
    callback,
    completedAt: null,
    id: `rap_${now}`,
    startedAt: now,
  };

  console.log('[common] Creating a new rap', currentRap);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return currentRap;
};

export const createNewAction = (type, parameters) => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  console.log('[common] Creating a new action', newAction);
  return newAction;
};
