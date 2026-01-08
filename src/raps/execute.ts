/* eslint-disable no-async-promise-executor */
/* eslint-disable no-promise-executor-return */
import { Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';
import { type BatchCall, executeBatchedTransaction, supportsDelegation } from '@rainbow-me/delegation';

import { ChainId } from '@/state/backendNetworks/types';
import { RainbowError, logger } from '@/logger';
import { claim, swap, unlock } from './actions';
import { crosschainSwap, prepareCrosschainSwap } from './actions/crosschainSwap';
import { claimBridge } from './actions/claimBridge';
import { prepareUnlock } from './actions/unlock';
import { prepareSwap } from './actions/swap';
import {
  ActionProps,
  PrepareActionProps,
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
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities/gas';
import type { NewTransaction } from '@/entities/transactions';
import { Screens, TimeToSignOperation, executeFn } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { createClaimClaimableRap } from './claimClaimable';
import { claimClaimable } from './actions/claimClaimable';
import { IS_TEST } from '@/env';
import { getProvider } from '@/handlers/web3';
import { Address } from 'viem';
import { addNewTransaction } from '@/state/pendingTransactions';
import { DELEGATION, getExperimentalFlag } from '@/config/experimental';

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

type PrepareActionResult = { call: BatchCall | null } | { call: BatchCall; transaction: Omit<NewTransaction, 'hash'> };

function typePrepareAction<T extends RapActionTypes>(type: T, props: PrepareActionProps<T>): () => Promise<PrepareActionResult> {
  switch (type) {
    case 'unlock':
      return () => prepareUnlock(props as PrepareActionProps<'unlock'>);
    case 'swap':
      return () => prepareSwap(props as PrepareActionProps<'swap'>);
    case 'crosschainSwap':
      return () => prepareCrosschainSwap(props as PrepareActionProps<'crosschainSwap'>);
    default:
      throw new Error(`Action type "${type}" does not support atomic execution`);
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
  gasFeeParamsBySpeed: RapSwapActionParameters<Exclude<T, 'unlock' | 'claim'>>['gasFeeParamsBySpeed'];
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

function getNodeAckDelay(chainId: ChainId): number {
  // When testing, give it some time to let approvals through
  if (IS_TEST) return 5000;

  switch (chainId) {
    case ChainId.mainnet:
      return 0;
    default:
      return 500;
  }
}

export const walletExecuteRap = async <T extends RapTypes>(
  wallet: Signer,
  type: T,
  parameters: RapSwapActionParameters<T>
): Promise<{ errorMessage: string | null; hash: string | null; nonce: number | undefined }> => {
  // NOTE: We don't care to track claimBridge raps
  const rap = PERF_TRACKING_EXEMPTIONS.includes(type)
    ? await createSwapRapByType(type, parameters)
    : await executeFn(createSwapRapByType, {
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.CreateRap,
        metadata: {
          degenMode: swapsStore.getState().degenMode,
        },
      })(type, parameters);

  const { actions } = rap;
  const rapName = getRapFullName(rap.actions);

  // Atomic execution if atomic flow is allowed (user preference) and supported for a chainId
  const { supported: delegationEnabled } = await supportsDelegation({
    address: parameters.quote?.from as Address,
    chainId: parameters.chainId,
  });
  const supportsBatching = getExperimentalFlag(DELEGATION) && delegationEnabled;
  if (supportsBatching && parameters.atomic && (type === 'swap' || type === 'crosschainSwap')) {
    const swapParams = parameters as RapSwapActionParameters<'swap' | 'crosschainSwap'>;
    const { chainId, quote, gasParams } = swapParams;
    const provider = getProvider({ chainId });
    const eip1559 = gasParams as TransactionGasParamAmounts;

    if (!quote) {
      return { nonce: undefined, hash: null, errorMessage: 'Quote is required for atomic execution' };
    }

    try {
      const calls: BatchCall[] = [];
      let pendingTransaction: Omit<NewTransaction, 'hash'> | null = null;

      for (const action of actions) {
        const prepareResult = await typePrepareAction(action.type, {
          parameters: action.parameters,
          wallet,
          chainId,
          quote,
        } as PrepareActionProps<typeof action.type>)();

        if (prepareResult.call) {
          calls.push(prepareResult.call);
        }
        if ('transaction' in prepareResult) {
          pendingTransaction = prepareResult.transaction;
        }
      }

      if (!calls.length) {
        return { nonce: undefined, hash: null, errorMessage: 'No calls to execute' };
      }

      const result = await executeFn(executeBatchedTransaction, {
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.BroadcastTransaction,
        metadata: { degenMode: swapsStore.getState().degenMode },
      })({
        signer: wallet as Wallet,
        address: quote.from as Address,
        chainId,
        provider,
        calls,
        value: BigInt(quote.value?.toString() ?? '0'),
        transactionOptions: {
          maxFeePerGas: BigInt(eip1559.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(eip1559.maxPriorityFeePerGas),
          gasLimit: null,
        },
      });

      if (!result.hash) {
        return { nonce: undefined, hash: null, errorMessage: 'Transaction failed - no hash returned' };
      }

      if (pendingTransaction) {
        const transaction: NewTransaction = {
          ...pendingTransaction,
          hash: result.hash,
        };
        addNewTransaction({
          address: quote.from,
          chainId,
          transaction,
        });
      }

      logger.debug(`[${rapName}] executed atomically`, { hash: result.hash });
      return { nonce: swapParams.nonce, hash: result.hash, errorMessage: null };
    } catch (error) {
      logger.error(new RainbowError(`[raps/execute]: ${rapName} - atomic execution failed`), {
        message: (error as Error)?.message,
      });
      return { nonce: undefined, hash: null, errorMessage: (error as Error)?.message ?? 'Unknown error' };
    }
  }

  // Sequential execution path
  let nonce = parameters?.nonce;
  let errorMessage: string | null = null;
  let hash: string | null = null;

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
    const shouldDelayForNodeAck = parameters.chainId !== ChainId.mainnet || IS_TEST;

    hash = firstHash ?? null;

    if (typeof baseNonce === 'number') {
      for (let index = 1; index < actions.length; index++) {
        hash && shouldDelayForNodeAck && (await delay(getNodeAckDelay(parameters.chainId)));

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
        hash = nextHash ?? hash;
      }
      nonce = baseNonce + actions.length - 1;
    } else {
      errorMessage = error;
      hash = null;
    }
  }
  return { errorMessage, hash, nonce };
};
