import { Logger } from '@ethersproject/logger';
import { Wallet } from '@ethersproject/wallet';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { Trade } from '@uniswap/sdk';
import { join, map } from 'lodash';
import { depositCompound, swap, unlock, withdrawCompound } from './actions';
import {
  createSwapAndDepositCompoundRap,
  estimateSwapAndDepositCompound,
} from './swapAndDepositCompound';
import { createUnlockAndSwapRap, estimateUnlockAndSwap } from './unlockAndSwap';
import {
  createWithdrawFromCompoundRap,
  estimateWithdrawFromCompound,
} from './withdrawFromCompound';
import { Asset } from '@rainbow-me/entities';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';

import logger from 'logger';

export enum RapActionType {
  depositCompound = 'depositCompound',
  swap = 'swap',
  unlock = 'unlock',
  withdrawCompound = 'withdrawCompound',
}

export interface RapActionParameters {
  amount?: string | null;
  assetToUnlock?: Asset;
  contractAddress?: string;
  inputAmount?: string | null;
  outputAmount?: string | null;
  tradeDetails?: Trade;
}

export interface UnlockActionParameters {
  amount: string;
  assetToUnlock: Asset;
  contractAddress: string;
}

export interface SwapActionParameters {
  inputAmount: string;
  outputAmount: string;
  tradeDetails: Trade;
}

export interface RapActionTransaction {
  hash: string | null;
}

export interface RapAction {
  parameters: RapActionParameters;
  transaction: RapActionTransaction;
  type: RapActionType;
}

export interface Rap {
  actions: RapAction[];
}

interface RapActionResponse {
  baseNonce?: number | null;
  errorMessage: string | null;
}

interface EthersError extends Error {
  code?: string | null;
}

const NOOP = () => null;

export const RapActionTypes = {
  depositCompound: 'depositCompound' as RapActionType,
  swap: 'swap' as RapActionType,
  unlock: 'unlock' as RapActionType,
  withdrawCompound: 'withdrawCompound' as RapActionType,
};

const createRapByType = (
  type: string,
  swapParameters: SwapActionParameters
) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return createSwapAndDepositCompoundRap(swapParameters);
    case ExchangeModalTypes.withdrawal:
      return createWithdrawFromCompoundRap(swapParameters);
    default:
      return createUnlockAndSwapRap(swapParameters);
  }
};

export const getRapEstimationByType = (
  type: string,
  swapParameters: SwapActionParameters
) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return estimateSwapAndDepositCompound(swapParameters);
    case ExchangeModalTypes.swap:
      return estimateUnlockAndSwap(swapParameters);
    case ExchangeModalTypes.withdrawal:
      return estimateWithdrawFromCompound();
    default:
      return null;
  }
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

const parseError = (error: EthersError): string => {
  const errorCode = error?.code;
  switch (errorCode) {
    case Logger.errors.UNPREDICTABLE_GAS_LIMIT:
      return 'Oh no! We were unable to estimate the gas limit. Please try again.';
    case Logger.errors.INSUFFICIENT_FUNDS:
      return 'Oh no! The gas price changed and you no longer have enough funds for this transaction. Please try again with a lower amount.';
    default:
      return 'Oh no! There was a problem submitting the transaction. Please try again.';
  }
};

const executeAction = async (
  action: RapAction,
  wallet: Wallet,
  rap: Rap,
  index: number,
  rapName: string,
  baseNonce?: number
): Promise<RapActionResponse> => {
  logger.log('[1 INNER] index', index);
  const { parameters, type } = action;
  const actionPromise = findActionByType(type);
  logger.log('[2 INNER] executing type', type);
  try {
    const nonce = await actionPromise(
      wallet,
      rap,
      index,
      parameters,
      baseNonce
    );
    return { baseNonce: nonce, errorMessage: null };
  } catch (error) {
    logger.sentry('[3 INNER] error running action, code:', error?.code);
    captureException(error);
    analytics.track('Rap failed', {
      category: 'raps',
      failed_action: type,
      label: rapName,
    });
    // If the first action failed, return an error message
    if (index === 0) {
      const errorMessage = parseError(error);
      logger.log('[4 INNER] displaying error message', errorMessage);
      return { baseNonce: null, errorMessage };
    }
    return { baseNonce: null, errorMessage: null };
  }
};

export const executeRap = async (
  wallet: Wallet,
  type: string,
  swapParameters: SwapActionParameters,
  callback: (success?: boolean, errorMessage?: string | null) => void
) => {
  const rap: Rap = await createRapByType(type, swapParameters);
  const { actions } = rap;
  const rapName = getRapFullName(actions);

  analytics.track('Rap started', {
    category: 'raps',
    label: rapName,
  });

  logger.log('[common - executing rap]: actions', actions);
  if (actions.length) {
    const firstAction = actions[0];
    const { baseNonce, errorMessage } = await executeAction(
      firstAction,
      wallet,
      rap,
      0,
      rapName
    );
    if (baseNonce) {
      for (let index = 1; index < actions.length; index++) {
        const action = actions[index];
        await executeAction(action, wallet, rap, index, rapName, baseNonce);
      }
      callback(true);
    } else {
      // Callback with failure state
      callback(false, errorMessage);
    }
  }

  analytics.track('Rap completed', {
    category: 'raps',
    label: rapName,
  });
  logger.log('[common - executing rap] finished execute rap function');
};

export const createNewRap = (actions: RapAction[]) => {
  return {
    actions,
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
