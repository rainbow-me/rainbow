import { relayService } from '@/features/delegation/relayService';
import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';

// ============ Types ========================================================= //

type ManagedExecutionFailureParams = {
  executionId: string;
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
    return formatManagedExecutionFailure(update.status);
  } catch {
    return fallbackManagedExecutionFailureMessage(status);
  }
}

/**
 * Formats relay failure details without issuing an additional status request.
 */
export function formatManagedExecutionFailure(status: RelayStatusSnapshot): string {
  const message = fallbackManagedExecutionFailureMessage(status.status);
  if (status.errorMessage) return `${message}: ${status.errorMessage}`;
  if (status.errorCode) return `${message}: ${status.errorCode}`;
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
