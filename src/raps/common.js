import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import depositCompound from './actions/depositCompound';
import unlock from './actions/unlock';
import swap from './actions/swap';
import withdrawCompound from './actions/withdrawCompound';
import analytics from '@segment/analytics-react-native';

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
    case RapActionTypes.depositCompound:
      return depositCompound;
    case RapActionTypes.withdrawCompound:
      return withdrawCompound;
    default:
      return NOOP;
  }
};

const getRapFullName = actions => {
  let name = '';
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    if (name !== '') name += ' + ';
    name += action.type;
  }
  return name;
};

export const executeRap = async (wallet, rap) => {
  const { actions } = rap;
  const rapName = getRapFullName(actions);

  analytics.track('Rap started', {
    category: 'raps',
    label: rapName,
  });

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
      analytics.track('Rap failed', {
        category: 'raps',
        failed_action: type,
        label: rapName,
      });
      break;
    }
  }

  analytics.track('Rap completed', {
    category: 'raps',
    label: rapName,
  });
  console.log('[common - executing rap] finished execute rap function');
};

export const createNewRap = (actions, callback = NOOP) => {
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
