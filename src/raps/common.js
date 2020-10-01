import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { get, join, map } from 'lodash';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import depositCompound from './actions/depositCompound';
import swap from './actions/swap';
import unlock from './actions/unlock';
import withdrawCompound from './actions/withdrawCompound';
import logger from 'logger';

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

  logger.log('[common - executing rap]: actions', actions);
  for (let index = 0; index < actions.length; index++) {
    logger.log('[1 INNER] index', index);
    const previousAction = index ? actions[index - 1] : defaultPreviousAction;
    logger.log('[2 INNER] previous action', previousAction);
    const previousActionWasSuccess = get(
      previousAction,
      'transaction.confirmed',
      false
    );
    logger.log(
      '[3 INNER] previous action was successful',
      previousActionWasSuccess
    );
    if (!previousActionWasSuccess) break;

    const action = actions[index];
    const { parameters, type } = action;
    const actionPromise = findActionByType(type);
    logger.log('[4 INNER] executing type', type);
    try {
      const output = await actionPromise(wallet, rap, index, parameters);
      logger.log('[5 INNER] action output', output);
      const nextAction = index < actions.length - 1 ? actions[index + 1] : null;
      logger.log('[6 INNER] next action', nextAction);
      if (nextAction) {
        logger.log('[7 INNER] updating params override');
        nextAction.parameters.override = output;
      }
    } catch (error) {
      logger.sentry('[5 INNER] error running action');
      captureException(error);
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
  logger.log('[common - executing rap] finished execute rap function');
};

export const createNewRap = (actions, callback = NOOP) => {
  const { dispatch } = store;
  const now = Date.now();
  const currentRap = {
    actions,
    callback,
    completedAt: null,
    id: `rap_${now}`,
    startedAt: now,
  };

  logger.log('[common] Creating a new rap', currentRap);
  dispatch(rapsAddOrUpdate(currentRap.id, currentRap));
  return currentRap;
};

export const createNewAction = (type, parameters) => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.log('[common] Creating a new action', newAction);
  return newAction;
};
