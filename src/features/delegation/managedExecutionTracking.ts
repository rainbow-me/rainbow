import type { NewTransaction, RainbowTransaction } from '@/entities/transactions';
import { TransactionStatus } from '@/entities/transactions';
import { logger, RainbowError } from '@/logger';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type ChainId } from '@/state/backendNetworks/types';
import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import { relayService } from './relayService';

// ============ Types ========================================================== //

export type ManagedExecutionStatus = 'PREPARED' | 'AWAITING_WALLET' | 'SUBMITTING' | 'PENDING' | 'CONFIRMED' | 'REVERTED' | 'FAILED';

type ManagedExecutionTxSet = {
  chainId: number;
  txHashes: readonly `0x${string}`[];
};

type ManagedExecutionOnchain =
  | {
      type: 'singlechain';
      origin: ManagedExecutionTxSet;
    }
  | {
      type: 'crosschain';
      origin: ManagedExecutionTxSet;
      destination: ManagedExecutionTxSet;
    };

export type ManagedExecutionStatusUpdate = {
  status: {
    status: ManagedExecutionStatus;
    updatedAtMs: number;
    onchain?: ManagedExecutionOnchain;
  };
};

export type ManagedExecutionObservation = {
  status: ManagedExecutionStatus;
  txHash?: NonNullable<NonNullable<ManagedExecutionStatusUpdate['status']['onchain']>['origin']>['txHashes'][number];
};

// ============ Constants ====================================================== //

const MANAGED_EXECUTION_TRACKING_MAX_ATTEMPTS = 30;
const MANAGED_EXECUTION_TRACKING_INTERVAL_MS = 1_000;

// ============ API ============================================================ //

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
    getStatus: relayService.intentRelay.transport.getStatus,
  })
    .then(observation => {
      if (!observation.txHash) {
        if (observation.status === 'FAILED' || observation.status === 'REVERTED') {
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
  getStatus: (executionId: string) => Promise<ManagedExecutionStatusUpdate>;
  maxAttempts?: number;
  intervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<ManagedExecutionObservation> {
  let latestStatus: ManagedExecutionStatus | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const update = await getStatus(executionId);
    const txHash = readOriginTxHash(update);

    latestStatus = update.status.status;
    if (txHash || isTerminalManagedStatus(latestStatus)) {
      return {
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
    status: latestStatus,
  };
}

// ============ Local Helpers ================================================== //

function readOriginTxHash(update: ManagedExecutionStatusUpdate): ManagedExecutionObservation['txHash'] {
  const onchain = update.status.onchain;
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

function isTerminalManagedStatus(status: ManagedExecutionStatus): boolean {
  return status === 'CONFIRMED' || status === 'REVERTED' || status === 'FAILED';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
