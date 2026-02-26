import { type Signer } from '@ethersproject/abstract-signer';
import { ErrorCode as EthersErrorCode } from '@ethersproject/logger';
import { Wallet } from '@ethersproject/wallet';
import { type BatchCall, executeBatchedTransaction, supportsDelegation, type UnsupportedReason } from '@rainbow-me/delegation';
import { ChainId } from '@/state/backendNetworks/types';
import { ensureError, RainbowError, logger } from '@/logger';
import { claim, swap, unlock } from './actions';
import { crosschainSwap, prepareCrosschainSwap } from './actions/crosschainSwap';
import { claimBridge } from './actions/claimBridge';
import { prepareUnlock } from './actions/unlock';
import { prepareSwap } from './actions/swap';
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
import { UserRejectedRequestError } from 'viem';
import { addNewTransaction } from '@/state/pendingTransactions';
import { DELEGATION, getExperimentalFlag } from '@/config/experimental';
import { getRemoteConfig } from '@/model/remoteConfig';
import { isRecordLike } from '@/types/guards';

type AtomicPrepareActionType = Extract<RapActionTypes, 'unlock' | 'swap' | 'crosschainSwap'>;
type PrepareActionResult = { call: BatchCall | null } | { call: BatchCall; transaction: Omit<NewTransaction, 'hash'> };
type RapFactoryResult = { actions: RapAction<RapActionTypes>[] };

type Executors = {
  action: { [K in RapActionTypes]: (props: ActionProps<K>) => Promise<RapActionResult> };
  prepare: { [K in AtomicPrepareActionType]: (props: PrepareActionProps<K>) => Promise<PrepareActionResult> };
  rapFactory: { [K in RapTypes]: (params: RapSwapActionParameters<K>) => Promise<RapFactoryResult> };
};

const executors: Executors = {
  action: {
    claim,
    claimBridge,
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
    claimBridge: createClaimAndBridgeRap,
    claimClaimable: createClaimClaimableRap,
    crosschainSwap: createUnlockAndCrosschainSwapRap,
    swap: createUnlockAndSwapRap,
  },
};

export function createSwapRapByType<T extends RapTypes>(type: T, swapParameters: RapSwapActionParameters<T>): Promise<RapFactoryResult> {
  return executors.rapFactory[type](swapParameters);
}

function runAction<T extends RapActionTypes>(type: T, props: ActionProps<T>): Promise<RapActionResult> {
  return executors.action[type](props);
}

function runAtomicPrepareAction<T extends AtomicPrepareActionType>(type: T, props: PrepareActionProps<T>): Promise<PrepareActionResult> {
  return executors.prepare[type](props);
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

const PERF_TRACKING_EXEMPTIONS: RapTypes[] = ['claimBridge', 'claimClaimable'];

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

  const actions = rap.actions;
  const rapName = getRapFullName(rap.actions);
  const delegationEnabled = getRemoteConfig().delegation_enabled || getExperimentalFlag(DELEGATION);
  const canAttemptAtomic = delegationEnabled && Boolean(parameters.atomic) && isAtomicRapType(type);

  let delegationSupported = false;
  let delegationUnsupportedReason: UnsupportedReason | 'NO_ADDRESS' | null = null;

  if (canAttemptAtomic) {
    const address = parameters.quote?.from;
    if (!address) {
      delegationUnsupportedReason = 'NO_ADDRESS';
    } else {
      try {
        const support = await supportsDelegation({
          address,
          chainId: parameters.chainId,
        });
        delegationSupported = support.supported;
        delegationUnsupportedReason = support.reason;
      } catch (e) {
        logger.warn(`[${rapName}] supportsDelegation check failed`, {
          message: ensureError(e).message,
        });
      }
    }
  }

  if (canAttemptAtomic && !delegationSupported) {
    logger.debug(`[${rapName}] atomic execution unavailable`, {
      reason: delegationUnsupportedReason,
      chainId: parameters.chainId,
      address: parameters.quote?.from,
    });
  }

  if (canAttemptAtomic && delegationSupported && isAtomicRapType(type)) {
    const { chainId, quote, gasParams, nonce } = parameters;
    const provider = getProvider({ chainId });
    const canExecuteAtomic = nonce !== undefined && isAtomicGasParams(gasParams);

    if (!quote) {
      return { nonce: undefined, hash: null, errorMessage: 'Quote is required for atomic execution' };
    }

    if (!(wallet instanceof Wallet)) {
      logger.debug(`[${rapName}] atomic execution skipped, falling back to sequential`, {
        reason: 'unsupported-signer',
      });
    } else if (canExecuteAtomic) {
      try {
        const calls: BatchCall[] = [];
        let pendingTransaction: Omit<NewTransaction, 'hash'> | null = null;

        for (const action of actions) {
          if (!isAtomicPrepareAction(action)) {
            throw new Error(`Action type "${action.type}" does not support atomic execution`);
          }

          const prepareResult = await runAtomicPrepareAction(action.type, {
            parameters: action.parameters,
            wallet,
            chainId,
            quote,
          });

          if (prepareResult.call) calls.push(prepareResult.call);

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
          signer: wallet,
          chainId,
          provider,
          calls,
          value: BigInt(quote.value?.toString() ?? '0'),
          transactionOptions: {
            maxFeePerGas: BigInt(gasParams.maxFeePerGas),
            maxPriorityFeePerGas: BigInt(gasParams.maxPriorityFeePerGas),
            gasLimit: null,
          },
          nonce,
        });

        if (!result.hash) {
          return { nonce: undefined, hash: null, errorMessage: 'Transaction failed - no hash returned' };
        }

        if (pendingTransaction) {
          const gasLimit = await getBroadcastGasLimit(result.hash, provider);
          const transaction: NewTransaction = {
            ...pendingTransaction,
            hash: result.hash,
            batch: true,
            delegation: result.type === 'eip7702',
            gasLimit: pendingTransaction.gasLimit ?? gasLimit,
          };
          addNewTransaction({
            address: quote.from,
            chainId,
            transaction,
          });
        }

        logger.debug(`[${rapName}] executed atomically`, { hash: result.hash });
        return { nonce, hash: result.hash, errorMessage: null };
      } catch (e) {
        const error = ensureError(e);
        const fallbackToSequential = !isUserRejectionError(error);
        logger.error(new RainbowError(`[raps/execute]: ${rapName} - atomic execution failed`), {
          message: error.message,
          fallbackToSequential,
        });

        if (!fallbackToSequential) {
          return { nonce: undefined, hash: null, errorMessage: error.message || 'Unknown error' };
        }

        logger.debug(`[${rapName}] falling back to sequential execution after atomic failure`);
      }
    } else {
      logger.debug(`[${rapName}] atomic execution skipped, falling back to sequential`, {
        reason: nonce === undefined ? 'missing nonce' : 'non-eip1559-gas-params',
      });
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

/**
 * Detects explicit user-rejection errors so atomic execution can stop immediately.
 * Recurses through `cause` as provider/wallet wrappers can nest the original error.
 */
function isUserRejectionError(error: unknown): boolean {
  if (!isRecordLike(error)) return false;
  if (
    error.code === UserRejectedRequestError.code ||
    error.code === EthersErrorCode.ACTION_REJECTED ||
    error.name === UserRejectedRequestError.name
  ) {
    return true;
  }
  return isUserRejectionError(error.cause);
}

function isAtomicGasParams(
  gasParams: RapSwapActionParameters<'swap' | 'crosschainSwap'>['gasParams']
): gasParams is TransactionGasParamAmounts {
  return 'maxFeePerGas' in gasParams && 'maxPriorityFeePerGas' in gasParams;
}

function isAtomicPrepareAction(action: RapAction<RapActionTypes>): action is RapAction<AtomicPrepareActionType> {
  return action.type === 'unlock' || action.type === 'swap' || action.type === 'crosschainSwap';
}

function isAtomicRapType(type: RapTypes): type is 'swap' | 'crosschainSwap' {
  return type === 'swap' || type === 'crosschainSwap';
}

async function getBroadcastGasLimit(hash: string, provider: Signer['provider']): Promise<string | undefined> {
  if (!provider) return undefined;

  try {
    const transaction = await provider.getTransaction(hash);
    return transaction?.gasLimit?.toString();
  } catch {
    return undefined;
  }
}
