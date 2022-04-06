import { Logger } from '@ethersproject/logger';
import { Wallet } from '@ethersproject/wallet';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import { Trade } from '@uniswap/sdk';
import { join, map } from 'lodash';
import {
  depositCompound,
  ens,
  swap,
  unlock,
  withdrawCompound,
} from './actions';
import {
  createCommitENSRap,
  createRegisterENSRap,
  createRenewENSRap,
  createSetNameENSRap,
  createSetRecordsENSRap,
} from './registerENS';
import {
  createSwapAndDepositCompoundRap,
  estimateSwapAndDepositCompound,
} from './swapAndDepositCompound';
import { createUnlockAndSwapRap, estimateUnlockAndSwap } from './unlockAndSwap';
import {
  createWithdrawFromCompoundRap,
  estimateWithdrawFromCompound,
} from './withdrawFromCompound';
import { Asset, EthereumAddress, Records } from '@rainbow-me/entities';
import {
  estimateENSCommitGasLimit,
  estimateENSRegisterSetRecordsAndNameGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
} from '@rainbow-me/handlers/ens';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import logger from 'logger';

const {
  commitENS,
  registerWithConfig,
  multicallENS,
  setTextENS,
  setNameENS,
  renewENS,
} = ens;

export enum RapActionType {
  depositCompound = 'depositCompound',
  swap = 'swap',
  unlock = 'unlock',
  withdrawCompound = 'withdrawCompound',
  commitENS = 'commitENS',
  registerENS = 'registerENS',
  multicallENS = 'multicallENS',
  renewENS = 'renewENS',
  setTextENS = 'setTextENS',
  setNameENS = 'setNameENS',
}

export interface RapExchangeActionParameters {
  amount?: string | null;
  assetToUnlock?: Asset;
  contractAddress?: string;
  inputAmount?: string | null;
  outputAmount?: string | null;
  tradeDetails?: Trade;
}

export interface RapENSActionParameters {
  duration: number;
  name: string;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  records?: Records;
  salt: string;
}

export interface UnlockActionParameters {
  amount: string;
  assetToUnlock: Asset;
  contractAddress: string;
}

export interface SwapActionParameters {
  inputAmount: string;
  nonce: number;
  outputAmount: string;
  tradeDetails: Trade;
}

export interface ENSActionParameters {
  duration: number;
  nonce?: number;
  name: string;
  rentPrice: string;
  ownerAddress: string;
  salt: string;
  records?: Records;
  setReverseRecord?: boolean;
  resolverAddress?: EthereumAddress;
}

export interface RapActionTransaction {
  hash: string | null;
}

enum RAP_TYPE {
  EXCHANGE = 'EXCHANGE',
  ENS = 'ENS',
}

export type RapAction = RapSwapAction | RapENSAction;

export interface RapSwapAction {
  parameters: RapExchangeActionParameters;
  transaction: RapActionTransaction;
  type: RapActionType;
}

export interface RapENSAction {
  parameters: RapENSActionParameters;
  transaction: RapActionTransaction;
  type: RapActionType;
}

export interface Rap {
  actions: RapAction[];
}

export interface ENSRap {
  actions: RapENSAction[];
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
  commitENS: 'commitENS' as RapActionType,
  depositCompound: 'depositCompound' as RapActionType,
  multicallENS: 'multicallENS' as RapActionType,
  registerENS: 'registerENS' as RapActionType,
  registerWithConfigENS: 'registerWithConfigENS' as RapActionType,
  renewENS: 'renewENS' as RapActionType,
  setNameENS: 'setNameENS' as RapActionType,
  setRecordsENS: 'setRecordsENS' as RapActionType,
  setTextENS: 'setTextENS' as RapActionType,
  swap: 'swap' as RapActionType,
  unlock: 'unlock' as RapActionType,
  withdrawCompound: 'withdrawCompound' as RapActionType,
};

const createSwapRapByType = (
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

const createENSRapByType = (
  type: string,
  ensRegistrationParameters: ENSActionParameters
) => {
  switch (type) {
    case RapActionTypes.registerENS:
      return createRegisterENSRap(ensRegistrationParameters);
    case RapActionTypes.renewENS:
      return createRenewENSRap(ensRegistrationParameters);
    case RapActionTypes.setNameENS:
      return createSetNameENSRap(ensRegistrationParameters);
    case RapActionTypes.setRecordsENS:
      return createSetRecordsENSRap(ensRegistrationParameters);
    case RapActionTypes.commitENS:
    default:
      return createCommitENSRap(ensRegistrationParameters);
  }
};

export const getSwapRapEstimationByType = (
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

export const getENSRapEstimationByType = (
  type: string,
  ensRegistrationParameters: ENSActionParameters
) => {
  switch (type) {
    case RapActionTypes.commitENS:
      return estimateENSCommitGasLimit(ensRegistrationParameters);
    case RapActionTypes.registerENS:
      return estimateENSRegisterSetRecordsAndNameGasLimit(
        ensRegistrationParameters
      );
    case RapActionTypes.renewENS:
      return estimateENSRenewGasLimit(ensRegistrationParameters);
    case RapActionTypes.setNameENS:
      return estimateENSSetNameGasLimit(ensRegistrationParameters);
    case RapActionTypes.setRecordsENS:
      return estimateENSSetRecordsGasLimit(ensRegistrationParameters);
    default:
      return null;
  }
};

const findSwapActionByType = (type: RapActionType) => {
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

const findENSActionByType = (type: RapActionType) => {
  switch (type) {
    case RapActionTypes.commitENS:
      return commitENS;
    case RapActionTypes.registerWithConfigENS:
      return registerWithConfig;
    case RapActionTypes.multicallENS:
      return multicallENS;
    case RapActionTypes.setTextENS:
      return setTextENS;
    case RapActionTypes.setNameENS:
      return setNameENS;
    case RapActionTypes.renewENS:
      return renewENS;
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
  const { type, parameters } = action;
  let nonce;
  try {
    logger.log('[2 INNER] executing type', type);
    const rapType = getRapTypeFromActionType(type);
    if (rapType === RAP_TYPE.ENS) {
      const actionPromise = findENSActionByType(type);
      nonce = await actionPromise(
        wallet,
        rap,
        index,
        parameters as RapENSActionParameters,
        baseNonce
      );
      return { baseNonce: nonce, errorMessage: null };
    } else {
      const actionPromise = findSwapActionByType(type);
      nonce = await actionPromise(
        wallet,
        rap,
        index,
        parameters as RapExchangeActionParameters,
        baseNonce
      );
      return { baseNonce: nonce, errorMessage: null };
    }
  } catch (error: any) {
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

const getRapTypeFromActionType = (actionType: RapActionType) => {
  switch (actionType) {
    case RapActionTypes.swap:
    case RapActionTypes.unlock:
    case RapActionTypes.depositCompound:
    case RapActionTypes.withdrawCompound:
      return RAP_TYPE.EXCHANGE;
    case RapActionTypes.commitENS:
    case RapActionTypes.registerENS:
    case RapActionTypes.registerWithConfigENS:
    case RapActionTypes.multicallENS:
    case RapActionTypes.renewENS:
    case RapActionTypes.setNameENS:
    case RapActionTypes.setTextENS:
    case RapActionTypes.setRecordsENS:
      return RAP_TYPE.ENS;
  }
  return '';
};

export const executeRap = async (
  wallet: Wallet,
  type: RapActionType,
  parameters: SwapActionParameters | ENSActionParameters,
  callback: (success?: boolean, errorMessage?: string | null) => void
) => {
  const rapType = getRapTypeFromActionType(type);

  let rap: Rap = { actions: [] };
  if (rapType === RAP_TYPE.EXCHANGE) {
    rap = await createSwapRapByType(type, parameters as SwapActionParameters);
  } else if (rapType === RAP_TYPE.ENS) {
    rap = await createENSRapByType(type, parameters as ENSActionParameters);
  }

  const { actions } = rap;
  const rapName = getRapFullName(actions);

  analytics.track('Rap started', {
    category: 'raps',
    label: rapName,
  });

  logger.log('[common - executing rap]: actions', actions);
  if (actions.length) {
    const firstAction = actions[0];
    const nonce = parameters?.nonce;
    const { baseNonce, errorMessage } = await executeAction(
      firstAction,
      wallet,
      rap,
      0,
      rapName,
      nonce
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
  parameters: RapExchangeActionParameters
): RapSwapAction => {
  const newAction = {
    parameters,
    rapType: RAP_TYPE.EXCHANGE,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.log('[common] Creating a new action', newAction);
  return newAction;
};

export const createNewENSAction = (
  type: RapActionType,
  parameters: ENSActionParameters
): RapENSAction => {
  const newAction = {
    parameters,
    transaction: { confirmed: null, hash: null },
    type,
  };

  logger.log('[common] Creating a new action', newAction);
  return newAction;
};
