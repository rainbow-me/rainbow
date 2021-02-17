import { Wallet } from '@ethersproject/wallet';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { Trade } from '@uniswap/sdk';
import { get, join, map } from 'lodash';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { depositCompound, swap, unlock, withdrawCompound } from './actions';
import { Asset, SelectedGasPrice } from '@rainbow-me/entities';

import logger from 'logger';

export enum RapActionType {
  depositCompound = 'depositCompound',
  swap = 'swap',
  unlock = 'unlock',
  withdrawCompound = 'withdrawCompound',
}

export interface RapActionParameters {
  accountAddress?: string;
  amount?: string | null;
  assetToUnlock?: Asset;
  contractAddress?: string;
  inputAmount?: string | null;
  inputCurrency?: Asset;
  isMax?: boolean;
  network?: string; // Network;
  outputCurrency?: Asset;
  override?: string | null | void;
  selectedGasPrice?: SelectedGasPrice;
  tradeDetails?: Trade;
}

export interface DepositActionParameters {
  accountAddress: string;
  inputAmount: string;
  inputCurrency: Asset;
  network: string;
  override?: string | null;
  selectedGasPrice: SelectedGasPrice;
}

export interface UnlockActionParameters {
  accountAddress: string;
  amount: string;
  assetToUnlock: Asset;
  contractAddress: string;
  override?: string | null;
  selectedGasPrice: SelectedGasPrice;
}

export interface SwapActionParameters {
  accountAddress: string;
  inputAmount: string;
  inputCurrency: Asset;
  outputCurrency: Asset;
  selectedGasPrice: SelectedGasPrice;
  tradeDetails: Trade;
}

export interface WithdrawActionParameters {
  accountAddress: string;
  inputAmount: string;
  inputCurrency: Asset;
  isMax: boolean;
  network: string;
  selectedGasPrice: SelectedGasPrice;
}

export interface RapActionTransaction {
  confirmed: boolean | null;
  hash: string | null;
}

export interface RapAction {
  parameters: RapActionParameters;
  transaction: RapActionTransaction;
  type: RapActionType;
}

export interface Rap {
  actions: RapAction[];
  callback: () => void;
  completedAt: string | null;
  id: string;
  startedAt: string;
}

const NOOP = () => {};

export const RapActionTypes = {
  depositCompound: 'depositCompound' as RapActionType,
  swap: 'swap' as RapActionType,
  unlock: 'unlock' as RapActionType,
  withdrawCompound: 'withdrawCompound' as RapActionType,
};

const findActionByType = (type: RapActionType) => {
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

const getRapFullName = (actions: RapAction[]) => {
  const actionTypes = map(actions, 'type');
  return join(actionTypes, ' + ');
};

const defaultPreviousAction = {
  transaction: {
    confirmed: true,
  },
};

export const executeRap = async (wallet: Wallet, rap: Rap) => {
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
    const currentActionHasBeenCompleted = get(
      action,
      'transaction.confirmed',
      false
    );

    // If the action is complete, skip it (we're resuming a rap!)
    if (currentActionHasBeenCompleted) {
      logger.log(
        '[3.5 INNER] ignoring current action because it was completed!'
      );
      continue;
    }

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

export const createNewRap = (actions: RapAction[], callback = NOOP) => {
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

export const createNewAction = (
  type: RapActionType,
  parameters: RapActionParameters
) => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.log('[common] Creating a new action', newAction);
  return newAction;
};
