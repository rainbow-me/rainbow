import { type Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';

import type { NewTransaction } from '@/entities/transactions';
import { IS_TEST } from '@/env';
import { trackCallsExecution } from '@/features/delegation/utils/callsExecutionTracking';
import { resolveManagedExecutionFailure } from '@/features/delegation/utils/managedExecutionFailure';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/features/gas/types/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { buildAtomicExecutionPolicy } from '@/raps/atomicSwapPreparation';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { execute, type CallsPlan, type EvmTransactionResult, type ExecutionResult, type PreparedCallsExecution } from '@rainbow-me/sdk';

import { swap, unlock } from './actions';
import { claimClaimable } from './actions/claimClaimable';
import { crosschainSwap, prepareCrosschainSwap } from './actions/crosschainSwap';
import { prepareSwap } from './actions/swap';
import { prepareUnlock } from './actions/unlock';
import { createClaimClaimableRap } from './claimClaimable';
import type {
  ActionProps,
  Rap,
  RapAction,
  RapActionResponse,
  RapActionResult,
  RapActionTypes,
  RapSwapActionParameters,
  RapTypes,
  SwapRap,
} from './references';
import { createUnlockAndCrosschainSwapRap } from './unlockAndCrosschainSwap';
import { createUnlockAndSwapRap } from './unlockAndSwap';
import { requireAddress } from './validation';

type Executors = {
  action: { [K in RapActionTypes]: (props: ActionProps<K>) => Promise<RapActionResult> };
  rapFactory: { [K in RapTypes]: (params: RapSwapActionParameters<K>) => Promise<Rap> };
};

const executors: Executors = {
  action: {
    claimClaimable,
    crosschainSwap,
    swap,
    unlock,
  },
  rapFactory: {
    claimClaimable: createClaimClaimableRap,
    crosschainSwap: createUnlockAndCrosschainSwapRap,
    swap: createUnlockAndSwapRap,
  },
};

function createRapByType<T extends RapTypes>(type: T, parameters: RapSwapActionParameters<T>): Promise<Rap> {
  return executors.rapFactory[type](parameters);
}

function runAction<T extends RapActionTypes>(type: T, props: ActionProps<T>): Promise<RapActionResult> {
  return executors.action[type](props);
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

async function prepareAtomicSwapRap(
  rap: SwapRap<'swap'> | SwapRap<'crosschainSwap'>
): Promise<{ calls: CallsPlan['calls']; transaction: Omit<NewTransaction, 'hash'> }> {
  const actions = rap.actions;
  const unlockAction = actions.length === 2 ? actions[0] : null;
  const swapAction = actions.length === 2 ? actions[1] : actions[0];

  const unlockCall = unlockAction ? (await prepareUnlock({ parameters: unlockAction.parameters })).call : null;
  const preparedSwap =
    swapAction.type === 'swap'
      ? await prepareSwap({ parameters: swapAction.parameters })
      : await prepareCrosschainSwap({ parameters: swapAction.parameters });

  return {
    calls: unlockCall ? [unlockCall, preparedSwap.call] : [preparedSwap.call],
    transaction: preparedSwap.transaction,
  };
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
  options?: { preparedCalls?: PreparedCallsExecution | null }
): Promise<{ errorMessage: string | null; hash: string | null; nonce: number | undefined }> {
  const rap = PERF_TRACKING_EXEMPTIONS.includes(type)
    ? await createRapByType(type, parameters)
    : await executeFn(createRapByType, {
        screen: Screens.SWAPS,
        operation: TimeToSignOperation.CreateRap,
        metadata: {
          degenMode: swapsStore.getState().degenMode,
        },
      })(type, parameters);

  const rapName = getRapFullName(rap.actions);

  if (parameters.atomic && supportsAtomicExecution(rap)) {
    const { chainId, quote, nonce } = parameters;
    const provider = getProvider({ chainId });

    if (!(wallet instanceof Wallet)) {
      return {
        nonce: undefined,
        hash: null,
        errorMessage: 'Atomic execution requires a local wallet signer',
      };
    }

    if (nonce === undefined) {
      return {
        nonce: undefined,
        hash: null,
        errorMessage: 'Atomic execution requires nonce metadata',
      };
    }

    try {
      const fromAddress = requireAddress(quote.from, 'atomic quote.from');
      const { calls, transaction } = await prepareAtomicSwapRap(rap);
      const prepared =
        options?.preparedCalls ??
        (await execute.prepare.calls({
          ...buildAtomicExecutionPolicy(chainId),
          signer: wallet,
          provider,
          chainId,
          calls,
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
        const failureMessage = await resolveManagedExecutionFailure({
          executionId: execution.executionId,
          status: execution.status,
        });

        if (failureMessage) {
          logger.error(new RainbowError(`[raps/execute]: ${rapName} - managed atomic execution failed before onchain submission`), {
            executionId: execution.executionId,
            status: execution.status,
            failureMessage,
          });
          return { nonce: undefined, hash: null, errorMessage: failureMessage };
        }

        trackCallsExecution({
          address: fromAddress,
          batch: true,
          chainId,
          execution,
          transaction,
        });

        logger.debug(`[${rapName}] submitted managed atomic execution`, {
          executionId: execution.executionId,
          status: execution.status,
        });
        return { nonce: undefined, hash: null, errorMessage: null };
      }

      const transactionResult = requireSingleWalletAtomicExecution(execution);

      trackCallsExecution({
        address: fromAddress,
        batch: true,
        chainId,
        execution: transactionResult,
        transaction,
      });

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
  }

  const actions = rap.actions;

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

function supportsAtomicExecution(rap: Rap): rap is SwapRap<'swap'> | SwapRap<'crosschainSwap'> {
  return rap.type === 'swap' || rap.type === 'crosschainSwap';
}

function requireSingleWalletAtomicExecution(result: ExecutionResult<'calls.wallet' | 'calls.managed'>): EvmTransactionResult {
  if (result.kind !== 'calls.wallet' || result.transactions.length !== 1) {
    throw new Error('Atomic execution must resolve to exactly one wallet transaction');
  }

  return result.transactions[0];
}
