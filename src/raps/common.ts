import { Wallet } from '@ethersproject/wallet';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { Trade } from '@uniswap/sdk';
import { join, map } from 'lodash';
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
  selectedGasPrice?: SelectedGasPrice;
  tradeDetails?: Trade;
}

export interface DepositActionParameters {
  accountAddress: string;
  inputAmount: string;
  inputCurrency: Asset;
  network: string;
  selectedGasPrice: SelectedGasPrice;
}

export interface UnlockActionParameters {
  accountAddress: string;
  amount: string;
  assetToUnlock: Asset;
  contractAddress: string;
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
    const action = actions[index];
    const { parameters, type } = action;
    const actionPromise = findActionByType(type);
    logger.log('[2 INNER] executing type', type);
    try {
      await actionPromise(wallet, rap, index, parameters);
    } catch (error) {
      logger.sentry('[3 INNER] error running action');
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

export const createNewRap = (actions: RapAction[]) => {
  const now = Date.now();
  return {
    actions,
    completedAt: null,
    id: `rap_${now}`,
    startedAt: now,
  };
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
