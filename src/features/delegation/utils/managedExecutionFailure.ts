import { RelayExecutionStatus, type RelayExecutionId, type RelayStatusSnapshot } from '@rainbow-me/sdk';

import { relayService } from './relayService';

// ============ Types ========================================================= //

type ManagedExecutionFailureParams = {
  executionId: RelayExecutionId;
  status: RelayExecutionStatus;
};

// ============ Failure Resolution ============================================ //

/**
 * Resolves a user-facing failure reason for terminal managed relay failures.
 */
export async function resolveManagedExecutionFailure({ executionId, status }: ManagedExecutionFailureParams): Promise<string | null> {
  if (!isManagedExecutionFailure(status)) return null;

  try {
    const update = await relayService.getStatus(executionId);
    return formatManagedExecutionFailure(update);
  } catch {
    return fallbackManagedExecutionFailureMessage(status);
  }
}

/**
 * Formats relay failure details without issuing an additional status request.
 */
export function formatManagedExecutionFailure(status: RelayStatusSnapshot): string {
  const message = fallbackManagedExecutionFailureMessage(status.status);
  if (status.error?.message) return `${message}: ${status.error.message}`;
  if (status.error?.code) return `${message}: ${status.error.code}`;
  return message;
}

/**
 * Returns true for terminal managed relay failure states.
 */
export function isManagedExecutionFailure(status: RelayExecutionStatus): boolean {
  return status === RelayExecutionStatus.Failed || status === RelayExecutionStatus.Reverted;
}

// ============ Helpers ======================================================= //

function fallbackManagedExecutionFailureMessage(status: RelayExecutionStatus): string {
  return status === RelayExecutionStatus.Reverted ? 'Managed relay execution reverted' : 'Managed relay execution failed';
}
