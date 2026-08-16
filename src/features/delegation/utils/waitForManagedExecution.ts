import { time } from '@/framework/core/utils/time';
import { ensureError, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';
import { RelayExecutionStatus, type RelayExecutionId, type RelayExecutionUpdate } from '@rainbow-me/sdk';

import { relayService } from './relayService';

// ============ Constants ===================================================== //

const MANAGED_EXECUTION_POLL_INTERVAL_MS = time.seconds(2);
const MANAGED_EXECUTION_TIMEOUT_MS = time.minutes(2);

// ============ Confirmation ================================================== //

/**
 * Waits until a managed relay execution confirms or reaches a terminal failure.
 */
export async function waitForManagedExecutionConfirmation(executionId: RelayExecutionId): Promise<void> {
  const startedAt = Date.now();
  let lastStatus: RelayExecutionStatus | null = null;
  let lastStatusErrorMessage: string | null = null;

  while (Date.now() - startedAt <= MANAGED_EXECUTION_TIMEOUT_MS) {
    let update: RelayExecutionUpdate;
    try {
      update = await relayService.getStatus(executionId);
    } catch (error) {
      lastStatusErrorMessage = ensureError(error).message;
      await delay(MANAGED_EXECUTION_POLL_INTERVAL_MS);
      continue;
    }

    lastStatus = update.status;
    lastStatusErrorMessage = null;

    if (lastStatus === RelayExecutionStatus.Confirmed) return;

    const failureMessage = readManagedExecutionFailure(update);
    if (failureMessage) {
      throw new RainbowError(`[waitForManagedExecutionConfirmation]: ${failureMessage}`);
    }

    await delay(MANAGED_EXECUTION_POLL_INTERVAL_MS);
  }

  const lastError = lastStatusErrorMessage ? `, last error: ${lastStatusErrorMessage}` : '';
  throw new RainbowError(
    `[waitForManagedExecutionConfirmation]: Timed out waiting for managed relay confirmation (${executionId}, last status: ${lastStatus ?? 'unknown'}${lastError})`
  );
}

function readManagedExecutionFailure(update: RelayExecutionUpdate): string | null {
  if (update.status !== RelayExecutionStatus.Failed && update.status !== RelayExecutionStatus.Reverted) return null;

  const message = update.status === RelayExecutionStatus.Reverted ? 'Managed relay execution reverted' : 'Managed relay execution failed';
  const detail = update.error?.message ?? update.error?.code;
  return detail ? `${message}: ${detail}` : message;
}
