import analytics from '@segment/analytics-react-native';
import { get, join, map } from 'lodash';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import depositCompound from './actions/depositCompound';
import unlock from './actions/unlock';
import swap from './actions/swap';
import withdrawCompound from './actions/withdrawCompound';

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
  const actionTypes = map(actions, 'type');
  return join(actionTypes, ' + ');
};

const defaultPreviousAction = {
  transaction: {
    confirmed: true,
  },
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
    console.log('[1 INNER] index', index);
    const previousAction = index ? actions[index - 1] : defaultPreviousAction;
    console.log('[2 INNER] previous action', previousAction);
    const previousActionWasSuccess = get(
      previousAction,
      'transaction.confirmed',
      false
    );
    console.log(
      '[3 INNER] previous action was successful',
      previousActionWasSuccess
    );
    if (!previousActionWasSuccess) break;

    const action = actions[index];
    const { parameters, type } = action;
    const actionPromise = findActionByType(type);
    console.log('[4 INNER] executing type', type);
    try {
      const output = await actionPromise(wallet, rap, index, parameters);
      console.log('[5 INNER] action output', output);
      const nextAction = index < actions.length - 1 ? actions[index + 1] : null;
      console.log('[6 INNER] next action', nextAction);
      if (nextAction) {
        console.log('[7 INNER] updating params override');
        nextAction.parameters.override = output;
      }
    } catch (error) {
      console.log('[5 INNER] error running action', error);
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
