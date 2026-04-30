import { relayService, type RelayStatusResponse } from '@/features/delegation/relayService';
import { ensureError, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { RelayExecutionStatus } from '@rainbow-me/delegation';

import { formatManagedExecutionFailure, isManagedExecutionFailure } from './managedExecutionFailure';

// ============ Constants ===================================================== //

const MANAGED_EXECUTION_POLL_INTERVAL_MS = time.seconds(2);
const MANAGED_EXECUTION_TIMEOUT_MS = time.minutes(2);

// ============ Confirmation ================================================== //

/**
 * Waits until a managed relay execution confirms or reaches a terminal failure.
 */
export async function waitForManagedExecutionConfirmation(executionId: string): Promise<void> {
  const startedAt = Date.now();
  let lastStatus: RelayExecutionStatus | null = null;
  let lastStatusErrorMessage: string | null = null;

  while (Date.now() - startedAt <= MANAGED_EXECUTION_TIMEOUT_MS) {
    let update: RelayStatusResponse;
    try {
      update = await relayService.getStatus(executionId);
    } catch (error) {
      lastStatusErrorMessage = ensureError(error).message;
      await delay(MANAGED_EXECUTION_POLL_INTERVAL_MS);
      continue;
    }

    lastStatus = update.status.status;
    lastStatusErrorMessage = null;

    if (lastStatus === RelayExecutionStatus.Confirmed) return;

    if (isManagedExecutionFailure(lastStatus)) {
      throw new RainbowError(`[waitForManagedExecutionConfirmation]: ${formatManagedExecutionFailure(update.status)}`);
    }

    await delay(MANAGED_EXECUTION_POLL_INTERVAL_MS);
  }

  const lastError = lastStatusErrorMessage ? `, last error: ${lastStatusErrorMessage}` : '';
  throw new RainbowError(
    `[waitForManagedExecutionConfirmation]: Timed out waiting for managed relay confirmation (${executionId}, last status: ${lastStatus ?? 'unknown'}${lastError})`
  );
}
