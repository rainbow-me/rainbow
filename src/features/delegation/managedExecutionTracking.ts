import type { Hex } from 'viem';
import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';
import type { NewTransaction, RainbowTransaction } from '@/entities/transactions';
import { TransactionStatus } from '@/entities/transactions';
import { logger, RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type ChainId } from '@/state/backendNetworks/types';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { relayService } from './relayService';

// ============ Constants ====================================================== //

const MANAGED_EXECUTION_TRACKING_MAX_ATTEMPTS = 30;
const MANAGED_EXECUTION_TRACKING_INTERVAL_MS = time.seconds(1);

// ============ API ============================================================ //

export type ManagedExecutionObservation = {
  errorCode?: string;
  errorMessage?: string;
  status: RelayExecutionStatus;
  txHash?: Hex;
};

export function trackManagedCallsExecution({
  address,
  chainId,
  executionId,
  transaction,
}: {
  address: string;
  chainId: ChainId;
  executionId: string;
  transaction: Omit<NewTransaction, 'hash'>;
}): void {
  const trackedTransaction = bindManagedExecution(transaction, executionId);
  showManagedExecutionPendingToast(trackedTransaction);

  void waitForManagedExecutionOnchain({
    executionId,
    getStatus: relayService.getStatus,
  })
    .then(observation => {
      if (!observation.txHash) {
        if (observation.status === RelayExecutionStatus.Failed || observation.status === RelayExecutionStatus.Reverted) {
          logger.warn('[managedExecutionTracking]: managed relay execution failed before onchain evidence', {
            executionId,
            errorCode: observation.errorCode,
            errorMessage: observation.errorMessage,
            status: observation.status,
          });
          showManagedExecutionFailedToast(trackedTransaction);
          return;
        }

        logger.warn('[managedExecutionTracking]: relay execution finished without onchain transaction evidence', {
          executionId,
          status: observation.status,
        });
        return;
      }

      addNewTransaction({
        address,
        chainId,
        transaction: {
          ...trackedTransaction,
          hash: observation.txHash,
          nonce: 0,
        },
      });
    })
    .catch(error => {
      logger.error(new RainbowError('[managedExecutionTracking]: failed to track managed relay execution', error), { executionId });
    });
}

export async function waitForManagedExecutionOnchain({
  executionId,
  getStatus,
  maxAttempts = MANAGED_EXECUTION_TRACKING_MAX_ATTEMPTS,
  intervalMs = MANAGED_EXECUTION_TRACKING_INTERVAL_MS,
  sleep = delay,
}: {
  executionId: string;
  getStatus: (executionId: string) => Promise<{ status: RelayStatusSnapshot }>;
  maxAttempts?: number;
  intervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<ManagedExecutionObservation> {
  let latestStatus: RelayExecutionStatus | undefined;
  let latestErrorCode: string | undefined;
  let latestErrorMessage: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const update = await getStatus(executionId);
    const txHash = readOriginTxHash(update.status);

    latestStatus = update.status.status;
    latestErrorCode = update.status.errorCode;
    latestErrorMessage = update.status.errorMessage;
    if (txHash || isTerminalManagedStatus(latestStatus)) {
      return {
        errorCode: latestErrorCode,
        errorMessage: latestErrorMessage,
        status: latestStatus,
        txHash,
      };
    }

    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  if (!latestStatus) {
    throw new Error(`Managed relay execution ${executionId} returned no status updates`);
  }

  return {
    errorCode: latestErrorCode,
    errorMessage: latestErrorMessage,
    status: latestStatus,
  };
}

// ============ Local Helpers ================================================== //

function readOriginTxHash(status: RelayStatusSnapshot): ManagedExecutionObservation['txHash'] {
  const onchain = status.onchain;
  return onchain?.origin.txHashes[0];
}

function bindManagedExecution(
  transaction: Omit<NewTransaction, 'hash'>,
  executionId: string
): Omit<NewTransaction, 'hash'> & { relayExecutionId: string } {
  return {
    ...transaction,
    relayExecutionId: executionId,
  };
}

function showManagedExecutionPendingToast(transaction: Omit<NewTransaction, 'hash'> & { relayExecutionId: string }): void {
  useRainbowToastsStore.getState().handleTransaction(buildManagedExecutionToastTransaction(transaction, TransactionStatus.pending));
}

function showManagedExecutionFailedToast(transaction: Omit<NewTransaction, 'hash'> & { relayExecutionId: string }): void {
  useRainbowToastsStore.getState().handleTransaction(buildManagedExecutionToastTransaction(transaction, TransactionStatus.failed));
}

function buildManagedExecutionToastTransaction(
  transaction: Omit<NewTransaction, 'hash'> & { relayExecutionId: string },
  status: TransactionStatus
): RainbowTransaction {
  const asset = transaction.changes?.[0]?.asset || transaction.asset;

  return {
    ...transaction,
    asset,
    description: asset?.name,
    hash: transaction.relayExecutionId,
    relayExecutionId: transaction.relayExecutionId,
    status,
    timestamp: Date.now(),
    title: `${transaction.type}.${status}`,
  };
}

function isTerminalManagedStatus(status: RelayExecutionStatus): boolean {
  return status === RelayExecutionStatus.Confirmed || status === RelayExecutionStatus.Reverted || status === RelayExecutionStatus.Failed;
}
