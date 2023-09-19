import { Provider } from '@ethersproject/abstract-provider';
import { Logger } from '@ethersproject/logger';
import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote, Quote, SwapType } from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { ens, swap, crosschainSwap, unlock } from './actions';
import {
  createCommitENSRap,
  createRegisterENSRap,
  createRenewENSRap,
  createSetNameENSRap,
  createSetRecordsENSRap,
  createTransferENSRap,
} from './registerENS';
import { createUnlockAndSwapRap, estimateUnlockAndSwap } from './unlockAndSwap';
import { analytics } from '@/analytics';
import { Asset, EthereumAddress, Records, SwappableAsset } from '@/entities';
import {
  estimateENSCommitGasLimit,
  estimateENSRegisterSetRecordsAndNameGasLimit,
  estimateENSRenewGasLimit,
  estimateENSSetNameGasLimit,
  estimateENSSetRecordsGasLimit,
} from '@/handlers/ens';
import { ExchangeModalTypes } from '@/helpers';
import { REGISTRATION_MODES } from '@/helpers/ens';
import logger from '@/utils/logger';
import {
  createUnlockAndCrosschainSwapRap,
  estimateUnlockAndCrosschainSwap,
} from './unlockAndCrosschainSwap';
import { Source, SwapModalField } from '@/redux/swap';
import * as i18n from '@/languages';

const {
  commitENS,
  registerWithConfig,
  multicallENS,
  setAddrENS,
  reclaimENS,
  setContenthashENS,
  setTextENS,
  setNameENS,
  renewENS,
} = ens;

export enum RapActionType {
  swap = 'swap',
  crosschainSwap = 'crosschainSwap',
  unlock = 'unlock',
  commitENS = 'commitENS',
  registerENS = 'registerENS',
  multicallENS = 'multicallENS',
  renewENS = 'renewENS',
  setAddrENS = 'setAddrENS',
  reclaimENS = 'reclaimENS',
  setContenthashENS = 'setContenthashENS',
  setTextENS = 'setTextENS',
  setNameENS = 'setNameENS',
}

export interface RapExchangeActionParameters {
  amount?: string | null;
  assetToUnlock?: Asset;
  contractAddress?: string;
  inputAmount?: string | null;
  outputAmount?: string | null;
  tradeDetails?: Quote;
  permit?: boolean;
  flashbots?: boolean;
  chainId?: number;
  requiresApprove?: boolean;
  meta?: SwapMetadata;
}

export interface RapENSActionParameters {
  duration: number;
  name: string;
  ownerAddress: EthereumAddress;
  rentPrice: string;
  records?: Records;
  salt: string;
  toAddress?: string;
  mode?: keyof typeof REGISTRATION_MODES;
}

export interface UnlockActionParameters {
  amount: string;
  assetToUnlock: Asset;
  contractAddress: string;
  chainId: number;
}

export type SwapMetadata = {
  flashbots: boolean;
  slippage: number;
  route: Source;
  inputAsset: SwappableAsset;
  outputAsset: SwappableAsset;
  independentField: SwapModalField;
  independentValue: string;
};

export interface BaseSwapActionParameters {
  inputAmount: string;
  nonce?: number;
  outputAmount: string;
  permit?: boolean;
  flashbots?: boolean;
  provider?: Provider;
  chainId: number;
  requiresApprove?: boolean;
  swapType?: SwapType;
  meta?: SwapMetadata;
}

export interface SwapActionParameters extends BaseSwapActionParameters {
  tradeDetails: Quote;
}

export interface CrosschainSwapActionParameters
  extends BaseSwapActionParameters {
  tradeDetails: CrosschainQuote;
}

export interface ENSActionParameters {
  duration: number;
  nonce?: number;
  name: string;
  rentPrice: string;
  ownerAddress: string;
  toAddress?: string;
  salt: string;
  records?: Records;
  setReverseRecord?: boolean;
  resolverAddress?: EthereumAddress;
  clearRecords?: boolean;
  setAddress?: boolean;
  transferControl?: boolean;
  mode?: keyof typeof REGISTRATION_MODES;
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
  multicallENS: 'multicallENS' as RapActionType,
  reclaimENS: 'reclaimENS' as RapActionType,
  registerENS: 'registerENS' as RapActionType,
  registerWithConfigENS: 'registerWithConfigENS' as RapActionType,
  renewENS: 'renewENS' as RapActionType,
  setAddrENS: 'setAddrENS' as RapActionType,
  setContenthashENS: 'setContenthashENS' as RapActionType,
  setNameENS: 'setNameENS' as RapActionType,
  setRecordsENS: 'setRecordsENS' as RapActionType,
  setTextENS: 'setTextENS' as RapActionType,
  swap: 'swap' as RapActionType,
  crosschainSwap: 'crosschainSwap' as RapActionType,
  transferENS: 'transferENS' as RapActionType,
  unlock: 'unlock' as RapActionType,
};

export const getSwapRapTypeByExchangeType = (isCrosschainSwap: boolean) => {
  if (isCrosschainSwap) {
    return RapActionTypes.crosschainSwap;
  }
  return RapActionTypes.swap;
};

const createSwapRapByType = (
  type: keyof typeof RapActionTypes,
  swapParameters: SwapActionParameters | CrosschainSwapActionParameters
) => {
  switch (type) {
    case RapActionTypes.crosschainSwap:
      return createUnlockAndCrosschainSwapRap(
        swapParameters as CrosschainSwapActionParameters
      );
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
    case RapActionTypes.transferENS:
      return createTransferENSRap(ensRegistrationParameters);
    case RapActionTypes.commitENS:
    default:
      return createCommitENSRap(ensRegistrationParameters);
  }
};

export const getSwapRapEstimationByType = (
  type: keyof typeof RapActionTypes,
  swapParameters: SwapActionParameters | CrosschainSwapActionParameters
) => {
  switch (type) {
    case RapActionTypes.swap:
      return estimateUnlockAndSwap(swapParameters);
    case RapActionTypes.crosschainSwap:
      return estimateUnlockAndCrosschainSwap(
        swapParameters as CrosschainSwapActionParameters
      );
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
    case RapActionTypes.crosschainSwap:
      return crosschainSwap;
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
    case RapActionTypes.setAddrENS:
      return setAddrENS;
    case RapActionTypes.setContenthashENS:
      return setContenthashENS;
    case RapActionTypes.setTextENS:
      return setTextENS;
    case RapActionTypes.setNameENS:
      return setNameENS;
    case RapActionTypes.reclaimENS:
      return reclaimENS;
    case RapActionTypes.renewENS:
      return renewENS;
    default:
      return NOOP;
  }
};

const getRapFullName = (actions: RapAction[]) => {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
};

// i18n
const parseError = (error: EthersError): string => {
  const errorCode = error?.code;
  switch (errorCode) {
    case Logger.errors.UNPREDICTABLE_GAS_LIMIT:
      return i18n.t(i18n.l.wallet.transaction.errors.unpredictable_gas);
    case Logger.errors.INSUFFICIENT_FUNDS:
      return i18n.t(i18n.l.wallet.transaction.errors.insufficient_funds);
    default:
      return i18n.t(i18n.l.wallet.transaction.errors.generic);
  }
};

const executeAction = async (
  action: RapAction,
  wallet: Signer,
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
    logger.debug('Rap blew up', error);
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
    case RapActionTypes.crosschainSwap:
    case RapActionTypes.unlock:
      return RAP_TYPE.EXCHANGE;
    case RapActionTypes.commitENS:
    case RapActionTypes.registerENS:
    case RapActionTypes.registerWithConfigENS:
    case RapActionTypes.multicallENS:
    case RapActionTypes.renewENS:
    case RapActionTypes.setNameENS:
    case RapActionTypes.setAddrENS:
    case RapActionTypes.reclaimENS:
    case RapActionTypes.setContenthashENS:
    case RapActionTypes.setTextENS:
    case RapActionTypes.setRecordsENS:
    case RapActionTypes.transferENS:
      return RAP_TYPE.ENS;
  }
  return '';
};

export const executeRap = async (
  wallet: Signer,
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

  let nonce = parameters?.nonce;

  logger.log('[common - executing rap]: actions', actions);
  if (actions.length) {
    const firstAction = actions[0];
    const { baseNonce, errorMessage } = await executeAction(
      firstAction,
      wallet,
      rap,
      0,
      rapName,
      nonce
    );

    if (typeof baseNonce === 'number') {
      for (let index = 1; index < actions.length; index++) {
        const action = actions[index];
        await executeAction(action, wallet, rap, index, rapName, baseNonce);
      }
      nonce = baseNonce + actions.length - 1;
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

  return { nonce };
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
