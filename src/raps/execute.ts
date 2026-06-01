import { type Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';

import type { NewTransaction } from '@/entities/transactions';
import { IS_TEST } from '@/env';
import { trackCallsExecution, trackManagedCallsExecutionResult } from '@/features/delegation/callsExecutionTracking';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { buildAtomicExecutionRequirements } from '@/raps/atomicSwapPreparation';
import { ChainId } from '@/state/backendNetworks/types';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { execute, type Call, type ExecuteCallsResult, type ExecutionResult, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { swap, unlock } from './actions';
import { claimClaimable } from './actions/claimClaimable';
import { crosschainSwap, prepareCrosschainSwap } from './actions/crosschainSwap';
import { prepareSwap } from './actions/swap';
import { prepareUnlock } from './actions/unlock';
import { createClaimClaimableRap } from './claimClaimable';
import type {
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
import { createUnlockAndSwapRap } from './unlockAndSwap';
import { requireAddress } from './validation';

type AtomicPrepareActionType = Extract<RapActionTypes, 'unlock' | 'swap' | 'crosschainSwap'>;
type PrepareActionResult = { call: Call | null } | { call: Call; transaction: Omit<NewTransaction, 'hash'> };
type RapFactoryResult = { actions: RapAction<RapActionTypes>[] };
type WalletExecuteRapOptions = { preparedCalls?: PreparedCallsExecution | null };

type Executors = {
  action: { [K in RapActionTypes]: (props: ActionProps<K>) => Promise<RapActionResult> };
  prepare: { [K in AtomicPrepareActionType]: (props: PrepareActionProps<K>) => Promise<PrepareActionResult> };
  rapFactory: { [K in RapTypes]: (params: RapSwapActionParameters<K>) => Promise<RapFactoryResult> };
};

const executors: Executors = {
  action: {
    claimClaimable,
    crosschainSwap,
    swap,
    unlock,
  },
  prepare: {
    crosschainSwap: prepareCrosschainSwap,
    swap: prepareSwap,
    unlock: prepareUnlock,
  },
  rapFactory: {
    claimClaimable: createClaimClaimableRap,
    crosschainSwap: createUnlockAndCrosschainSwapRap,
    swap: createUnlockAndSwapRap,
  },
};

function createSwapRapByType<T extends RapTypes>(type: T, swapParameters: RapSwapActionParameters<T>): Promise<RapFactoryResult> {
  return executors.rapFactory[type](swapParameters);
}

function runAction<T extends RapActionTypes>(type: T, props: ActionProps<T>): Promise<RapActionResult> {
  return executors.action[type](props);
}

function runAtomicPrepareAction<T extends AtomicPrepareActionType>(type: T, props: PrepareActionProps<T>): Promise<PrepareActionResult> {
  return executors.prepare[type](props);
}

async function executeAction<T extends RapActionTypes>({
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
  gasFeeParamsBySpeed: ActionProps<T>['gasFeeParamsBySpeed'];
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
    const { nonce, hash } = await runAction(type, actionProps);
    return { baseNonce: nonce, errorMessage: null, hash };
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError(`[raps/execute]: ${rapName} - error execute action`), {
      message: error.message,
    });
    return { baseNonce: null, errorMessage: error.toString() };
  }
}

function getRapFullName<T extends RapActionTypes>(actions: RapAction<T>[]) {
  const actionTypes = actions.map(action => action.type);
  return actionTypes.join(' + ');
}

function delay(ms: number): Promise<void> {
  return new Promise(res => {
    setTimeout(res, ms);
  });
}

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

const PERF_TRACKING_EXEMPTIONS: RapTypes[] = ['claimClaimable'];

export async function walletExecuteRap<T extends RapTypes>(
  wallet: Signer,
  type: T,
  parameters: RapSwapActionParameters<T>,
  options?: WalletExecuteRapOptions
): Promise<{ errorMessage: string | null; hash: string | null; nonce: number | undefined }> {
  // NOTE: We don't care to track claimable raps
  const rap = PERF_TRACKING_EXEMPTIONS.includes(type)
    ? await createSwapRapByType(type, parameters)
    : await executeFn(createSwapRapByType, {
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.CreateRap,
        metadata: {
          degenMode: swapsStore.getState().degenMode,
        },
      })(type, parameters);

  const actions = rap.actions;
  const rapName = getRapFullName(rap.actions);
  const canAttemptAtomic = Boolean(parameters.atomic) && isAtomicRapType(type);
  const cachedPreparedCalls = isAtomicRapType(type) ? (options?.preparedCalls ?? null) : null;

  if (canAttemptAtomic && isAtomicRapType(type)) {
    const { chainId, quote, nonce } = parameters;
    const provider = getProvider({ chainId });

    if (!quote) {
      return { nonce: undefined, hash: null, errorMessage: 'Quote is required for atomic execution' };
    }

    if (!(wallet instanceof Wallet)) {
      return {
        nonce: undefined,
        hash: null,
        errorMessage: 'Atomic execution requires a local wallet signer',
      };
    } else if (nonce !== undefined) {
      try {
        const calls: Call[] = [];
        const fromAddress = requireAddress(quote.from, 'atomic quote.from');
        let pendingTransaction: Omit<NewTransaction, 'hash'> | null = null;

        for (const action of actions) {
          if (!isAtomicPrepareAction(action)) {
            throw new Error(`Action type "${action.type}" does not support atomic execution`);
          }

          const prepareResult = await runAtomicPrepareAction(action.type, {
            parameters: action.parameters,
            wallet,
            quote,
          });

          if (!cachedPreparedCalls && prepareResult.call) calls.push(prepareResult.call);

          if ('transaction' in prepareResult) pendingTransaction = prepareResult.transaction;
        }

        if (!cachedPreparedCalls && !calls.length) {
          return { nonce: undefined, hash: null, errorMessage: 'No calls to execute' };
        }

        const prepared =
          cachedPreparedCalls ??
          (await execute.prepare.calls({
            signer: wallet,
            provider,
            chainId,
            calls,
            requirements: buildAtomicExecutionRequirements(chainId),
          }));

        const execution = await executeFn(execute.calls, {
          screen: Screens.SWAPS,
          operation: TimeToSignOperation.BroadcastTransaction,
          metadata: { degenMode: swapsStore.getState().degenMode },
        })(prepared, {
          chainId,
          provider,
          signer: wallet,
        });

        if (execution.kind === 'calls.managed') {
          if (!pendingTransaction) {
            logger.error(new RainbowError(`[raps/execute]: ${rapName} - missing transaction metadata for managed atomic execution`), {
              executionId: execution.executionId,
              status: execution.status,
            });
            return {
              nonce: undefined,
              hash: null,
              errorMessage: 'Missing transaction metadata for managed atomic execution',
            };
          }

          const failureMessage = await trackManagedCallsExecutionResult({
            address: fromAddress,
            batch: true,
            execution,
            transaction: pendingTransaction,
          });

          if (failureMessage) {
            logger.error(new RainbowError(`[raps/execute]: ${rapName} - managed atomic execution failed before onchain submission`), {
              executionId: execution.executionId,
              status: execution.status,
              failureMessage,
            });
            return { nonce: undefined, hash: null, errorMessage: failureMessage };
          }

          logger.debug(`[${rapName}] submitted managed atomic execution`, {
            executionId: execution.executionId,
            status: execution.status,
          });
          return { nonce: undefined, hash: null, errorMessage: null };
        }

        const transactionResult = requireSingleWalletAtomicExecution(execution);

        if (pendingTransaction) {
          trackCallsExecution({
            address: fromAddress,
            batch: true,
            chainId,
            execution: transactionResult,
            transaction: pendingTransaction,
          });
        }

        logger.debug(`[${rapName}] executed atomically`, { hash: transactionResult.hash });
        return { nonce: transactionResult.transaction.nonce, hash: transactionResult.hash, errorMessage: null };
      } catch (e) {
        const error = ensureError(e);
        logger.error(new RainbowError(`[raps/execute]: ${rapName} - atomic execution failed`), {
          message: error.message,
          fallbackToSequential: false,
        });

        return { nonce: undefined, hash: null, errorMessage: error.message || 'Unknown error' };
      }
    } else {
      return {
        nonce: undefined,
        hash: null,
        errorMessage: 'Atomic execution requires nonce metadata',
      };
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
}

function isAtomicPrepareAction(action: RapAction<RapActionTypes>): action is RapAction<AtomicPrepareActionType> {
  return action.type === 'unlock' || action.type === 'swap' || action.type === 'crosschainSwap';
}

function isAtomicRapType(type: RapTypes): type is 'swap' | 'crosschainSwap' {
  return type === 'swap' || type === 'crosschainSwap';
}

function requireSingleWalletAtomicExecution(result: ExecuteCallsResult): ExecutionResult {
  if (result.kind !== 'calls.wallet' || result.transactions.length !== 1) {
    throw new Error('Atomic execution must resolve to exactly one wallet transaction');
  }

  return result.transactions[0];
}
