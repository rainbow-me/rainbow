/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { Signer } from '@ethersproject/abstract-signer';
import { ChainId } from '@/state/backendNetworks/types';
import { RainbowError, logger } from '@/logger';

import { claim, swap, unlock } from './actions';
import { crosschainSwap } from './actions/crosschainSwap';
import { claimBridge } from './actions/claimBridge';
import {
  ActionProps,
  Rap,
  RapAction,
  RapActionResponse,
  RapActionResult,
  RapActionTypes,
  RapSwapActionParameters,
  RapTypes,
} from './references';
import { createUnlockAndCrosschainSwapRap } from './unlockAndCrosschainSwap';
import { createClaimAndBridgeRap } from './claimAndBridge';
import { createUnlockAndSwapRap } from './unlockAndSwap';
import { GasFeeParamsBySpeed, LegacyGasFeeParamsBySpeed, LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { createClaimClaimableRap } from './claimClaimable';
import { claimClaimable } from './actions/claimClaimable';

const PERF_TRACKING_EXEMPTIONS: RapTypes[] = ['claimBridge', 'claimClaimable'];

export function createSwapRapByType<T extends RapTypes>(
  type: T,
  swapParameters: RapSwapActionParameters<T>
): Promise<{ actions: RapAction<RapActionTypes>[] }> {
  switch (type) {
    case 'claimBridge':
      return createClaimAndBridgeRap(swapParameters as RapSwapActionParameters<'claimBridge'>);
    case 'crosschainSwap':
      return createUnlockAndCrosschainSwapRap(swapParameters as RapSwapActionParameters<'crosschainSwap'>);
    case 'swap':
      return createUnlockAndSwapRap(swapParameters as RapSwapActionParameters<'swap'>);
    case 'claimClaimable':
      return createClaimClaimableRap(swapParameters as RapSwapActionParameters<'claimClaimable'>);
    default:
      return Promise.resolve({ actions: [] });
  }
}

function typeAction<T extends RapActionTypes>(type: T, props: ActionProps<T>) {
  switch (type) {
    case 'claim':
      return () => claim(props as ActionProps<'claim'>);
    case 'unlock':
      return () => unlock(props as ActionProps<'unlock'>);
    case 'swap':
      return () => swap(props as ActionProps<'swap'>);
    case 'claimBridge':
      return () => claimBridge(props as ActionProps<'claimBridge'>);
    case 'crosschainSwap':
      return () => crosschainSwap(props as ActionProps<'crosschainSwap'>);
    case 'claimClaimable':
      return () => claimClaimable(props as ActionProps<'claimClaimable'>);
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
  gasParams,
  gasFeeParamsBySpeed,
}: {
  action: RapAction<T>;
  wallet: Signer;
  rap: Rap;
  index: number;
  baseNonce?: number;
  rapName: string;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}): Promise<RapActionResponse> {
  const { type, parameters } = action;
  try {
    const actionProps = {
      wallet,
      currentRap: rap,
      index,
      parameters,
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
      return { baseNonce: null, errorMessage: error?.toString() ?? null };
    }
    return { baseNonce: null, errorMessage: error?.toString() ?? null };
  }
}

function getRapFullName<T extends RapActionTypes>(actions: RapAction<T>[]) {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const NODE_ACK_DELAY = 500;

export const walletExecuteRap = async (
  wallet: Signer,
  type: RapTypes,
  parameters: RapSwapActionParameters<'swap' | 'crosschainSwap' | 'claimBridge' | 'claimClaimable'>
): Promise<{ nonce: number | undefined; errorMessage: string | null }> => {
  // NOTE: We don't care to track claimBridge raps
  const rap = PERF_TRACKING_EXEMPTIONS.includes(type)
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
      gasParams: parameters?.gasParams,
      gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
    };

    const { baseNonce, errorMessage: error, hash: firstHash } = await executeAction(actionParams);
    const shouldDelayForNodeAck = parameters.chainId !== ChainId.mainnet;

    if (typeof baseNonce === 'number') {
      let latestHash = firstHash;
      for (let index = 1; index < actions.length; index++) {
        latestHash && shouldDelayForNodeAck && (await delay(NODE_ACK_DELAY));

        const action = actions[index];
        const actionParams = {
          action,
          wallet,
          rap,
          index,
          baseNonce,
          rapName,
          gasParams: parameters?.gasParams,
          gasFeeParamsBySpeed: parameters?.gasFeeParamsBySpeed,
        };
        const { hash: nextHash, errorMessage: error } = await executeAction(actionParams);
        // if previous action didn't fail, but the current one did, set the error message
        if (!errorMessage && error) {
          errorMessage = error;
        }
        latestHash = nextHash;
      }
      nonce = baseNonce + actions.length - 1;
    } else {
      errorMessage = error;
    }
  }
  return { nonce, errorMessage };
};
