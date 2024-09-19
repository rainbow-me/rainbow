/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { Signer } from '@ethersproject/abstract-signer';

import { RainbowError, logger } from '@/logger';

import { claimRewards, swap, unlock } from './actions';
import { crosschainSwap } from './actions/crosschainSwap';
import { claimRewardsBridge } from './actions/claimRewardsBridge';
import {
  ActionProps,
  ActionPropsV2,
  RapResponse,
  Rap,
  RapAction,
  RapActionParameterMap,
  RapActionParameters,
  RapActionResponse,
  RapActionResult,
  RapActionTypes,
  RapClaimClaimableActionParameters,
  RapClaimClaimableAndSwapBridgeParameters,
  RapParameterMap,
  RapSwapActionParameters,
  RapTypes,
} from './references';
import { createUnlockAndCrosschainSwapRap } from './unlockAndCrosschainSwap';
import { createClaimRewardsAndBridgeRap } from './claimRewardsAndBridge';
import { createUnlockAndSwapRap } from './unlockAndSwap';
import { GasFeeParamsBySpeed, LegacyGasFeeParamsBySpeed, LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { createClaimClaimableAndSwapBridgeRap } from './claimClaimableAndSwapBridge';
import { claimClaimable } from './actions/claimClaimable';

export function createSwapRapByType<T extends RapTypes>(
  type: T,
  swapParameters: RapSwapActionParameters<T>
): Promise<{ actions: RapAction<RapActionTypes>[] }> {
  switch (type) {
    case 'claimRewardsBridge':
      return createClaimRewardsAndBridgeRap(swapParameters as RapSwapActionParameters<'claimRewardsBridge'>);
    case 'crosschainSwap':
      return createUnlockAndCrosschainSwapRap(swapParameters as RapSwapActionParameters<'crosschainSwap'>);
    case 'swap':
      return createUnlockAndSwapRap(swapParameters as RapSwapActionParameters<'swap'>);
    default:
      return Promise.resolve({ actions: [] });
  }
}

export function createRapByType<T extends RapTypes>(
  type: T,
  parameters: NonNullable<RapParameterMap[T]>
): Promise<{ actions: RapAction<RapActionTypes>[] }> {
  switch (type) {
    case 'claimClaimableSwapBridge':
      return createClaimClaimableAndSwapBridgeRap(parameters);
    // TODO: other types
    default:
      return Promise.resolve({ actions: [] });
  }
}

function typeAction<T extends RapActionTypes>(type: T, props: ActionProps<T>) {
  switch (type) {
    case 'claimClaimable':
      return () => claimClaimable(props as ActionProps<'claimClaimable'>);
    case 'claimRewards':
      return () => claimRewards(props as ActionProps<'claimRewards'>);
    case 'unlock':
      return () => unlock(props as ActionProps<'unlock'>);
    case 'swap':
      return () => swap(props as ActionProps<'swap'>);
    case 'claimRewardsBridge':
      return () => claimRewardsBridge(props as ActionProps<'claimRewardsBridge'>);
    case 'crosschainSwap':
      return () => crosschainSwap(props as ActionProps<'crosschainSwap'>);
    default:
      // eslint-disable-next-line react/display-name
      return () => null;
  }
}

function typeActionV2<T extends RapActionTypes>(type: T, props: ActionPropsV2<T>) {
  switch (type) {
    case 'claimClaimable':
      return () => claimClaimable(props as ActionPropsV2<'claimClaimable'>);
    // case 'claimRewards':
    // return () => claimRewards(props as ActionProps<'claimRewards'>);
    // case 'unlock':
    //   return () => unlock(props as ActionProps<'unlock'>);
    // case 'swap':
    // return () => swap(props as ActionProps<'swap'>);
    // case 'claimRewardsBridge':
    //   return () => claimRewardsBridge(props as ActionProps<'claimRewardsBridge'>);
    // case 'crosschainSwap':
    //   return () => crosschainSwap(props as ActionProps<'crosschainSwap'>);
    default:
      // eslint-disable-next-line react/display-name
      return () => null;
  }
}

export async function executeAction<T extends RapActionTypes>({
  action,
  wallet,
  rap,
  index,
  baseNonce,
  rapName,
  flashbots,
  gasParams,
  gasFeeParamsBySpeed,
}: {
  action: RapAction<T>;
  wallet: Signer;
  rap: Rap;
  index: number;
  baseNonce?: number;
  rapName: string;
  flashbots?: boolean;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}): Promise<RapActionResponse> {
  const { type, parameters } = action;
  try {
    const actionProps = {
      wallet,
      currentRap: rap,
      index,
      parameters: { ...parameters, flashbots },
      baseNonce,
      gasParams,
      gasFeeParamsBySpeed,
    };
    const { nonce, hash } = (await typeAction<T>(type, actionProps)()) as RapActionResult;
    return { baseNonce: nonce, errorMessage: null, hash };
  } catch (error) {
    logger.error(new RainbowError(`[raps/execute]: ${rapName} - error execute action`), {
      message: (error as Error)?.message,
    });
    if (index === 0) {
      return { baseNonce: null, errorMessage: String(error) };
    }
    return { baseNonce: null, errorMessage: null };
  }
}

export async function executeActionV2<T extends RapActionTypes>({
  action,
  wallet,
  rap,
  index,
  baseNonce,
  rapName,
}: {
  action: RapAction<T>;
  wallet: Signer;
  rap: Rap;
  index: number;
  baseNonce?: number;
  rapName: string;
}): Promise<RapActionResponse> {
  const { type, parameters } = action;
  try {
    const actionProps = {
      wallet,
      currentRap: rap,
      index,
      parameters,
      baseNonce,
    };
    const { nonce, hash } = (await typeActionV2<T>(type, actionProps)()) as RapActionResult;
    return { baseNonce: nonce, errorMessage: null, hash };
  } catch (error) {
    logger.error(new RainbowError(`[raps/execute]: ${rapName} - error execute action`), {
      message: (error as Error)?.message,
    });
    if (index === 0) {
      return { baseNonce: null, errorMessage: String(error) };
    }
    return { baseNonce: null, errorMessage: null };
  }
}

function getRapFullName<T extends RapActionTypes>(actions: RapAction<T>[]) {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const waitForNodeAck = async (hash: string, provider: Signer['provider']): Promise<void> => {
  return new Promise(async resolve => {
    const tx = await provider?.getTransaction(hash);
    // This means the node is aware of the tx, we're good to go
    if ((tx && tx.blockNumber === null) || (tx && tx?.blockNumber && tx?.blockNumber > 0)) {
      resolve();
    } else {
      // Wait for 1 second and try again
      await delay(1000);
      return waitForNodeAck(hash, provider);
    }
  });
};

// export const executeClaimClaimableRap = async (
//   wallet: Signer,
//   parameters: RapClaimClaimableAndSwapBridgeParameters
// ): Promise<RapResponse> => {
//   const rap = await createClaimClaimableAndSwapBridgeRap(parameters);
//   return executeRap(wallet, rap, parameters.claimClaimableActionParameters.claimTx.nonce);
// };

const executeRap = async (
  wallet: Signer,
  rap: {
    actions: RapAction<RapActionTypes>[];
  },
  nonce?: number | undefined
): Promise<RapResponse> => {
  let currentNonce = nonce;
  const { actions } = rap;
  const rapName = getRapFullName(rap.actions);
  let errorMessage = null;
  if (actions.length) {
    const firstAction = actions[0];
    const actionParams = {
      action: firstAction,
      wallet,
      rap,
      index: 0,
      baseNonce: nonce,
      rapName,
    };

    const { baseNonce, errorMessage: error, hash } = await executeActionV2(actionParams);

    if (typeof baseNonce === 'number') {
      actions.length > 1 && hash && (await waitForNodeAck(hash, wallet.provider));
      for (let index = 1; index < actions.length; index++) {
        const action = actions[index];
        const actionParams = {
          action,
          wallet,
          rap,
          index,
          baseNonce,
          rapName,
        };
        const { hash } = await executeActionV2(actionParams);
        hash && (await waitForNodeAck(hash, wallet.provider));
      }
      currentNonce = baseNonce + actions.length - 1;
    } else {
      errorMessage = error;
    }
  }
  return { nonce: currentNonce, errorMessage };
};

export const walletExecuteRap = async (
  wallet: Signer,
  type: RapTypes,
  parameters: RapSwapActionParameters<'swap' | 'crosschainSwap' | 'claimRewardsBridge' | 'claimClaimableSwapBridge'>
): Promise<RapResponse> => {
  // NOTE: We don't care to track claimRewardsBridge raps
  const rap =
    type === 'claimRewardsBridge' || type === 'claimClaimableSwapBridge'
      ? await createSwapRapByType(type, parameters)
      : await performanceTracking.getState().executeFn({
          fn: createSwapRapByType,
          screen: Screens.SWAPS,
          operation: TimeToSignOperation.CreateRap,
          metadata: {
            degenMode: swapsStore.getState().degenMode,
          },
        })(type, parameters);

  const { actions } = rap;
  const rapName = getRapFullName(rap.actions);
  let nonce = parameters?.nonce;
  let errorMessage = null;
  if (actions.length) {
    const firstAction = actions[0];
    const actionParams = {
      action: firstAction,
      wallet,
      rap,
      index: 0,
      baseNonce: nonce,
      rapName,
      flashbots: parameters?.flashbots,
      gasParams: parameters?.gasParams,
      gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
    };

    const { baseNonce, errorMessage: error, hash } = await executeAction(actionParams);

    if (typeof baseNonce === 'number') {
      actions.length > 1 && hash && (await waitForNodeAck(hash, wallet.provider));
      for (let index = 1; index < actions.length; index++) {
        const action = actions[index];
        const actionParams = {
          action,
          wallet,
          rap,
          index,
          baseNonce,
          rapName,
          flashbots: parameters?.flashbots,
          gasParams: parameters?.gasParams,
          gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
        };
        const { hash } = await executeAction(actionParams);
        hash && (await waitForNodeAck(hash, wallet.provider));
      }
      nonce = baseNonce + actions.length - 1;
    } else {
      errorMessage = error;
    }
  }
  return { nonce, errorMessage };
};

export async function walletExecuteRapV2<T extends RapTypes>(
  wallet: Signer,
  type: T,
  parameters: NonNullable<RapParameterMap[T]>,
  nonce?: number | undefined
): Promise<RapResponse> {
  const rap = await createRapByType(type, parameters);
  return executeRap(wallet, rap, nonce);
}
