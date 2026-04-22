import { relayService } from '@/features/delegation/relayService';
import { RelayExecutionStatus, type RelayStatusSnapshot } from '@rainbow-me/delegation';

// ============ Types ========================================================= //

type ManagedExecutionFailureParams = {
  executionId: string;
  status: RelayExecutionStatus;
};

// ============ API =========================================================== //

export async function resolveManagedExecutionFailure({ executionId, status }: ManagedExecutionFailureParams): Promise<string | null> {
  if (!isManagedExecutionFailure(status)) return null;

  try {
    const update = await relayService.getStatus(executionId);
    return formatManagedExecutionFailure(update.status);
  } catch {
    return fallbackManagedExecutionFailureMessage(status);
  }
}

export function formatManagedExecutionFailure(status: RelayStatusSnapshot): string {
  const message = fallbackManagedExecutionFailureMessage(status.status);
  if (status.errorMessage) return `${message}: ${status.errorMessage}`;
  if (status.errorCode) return `${message}: ${status.errorCode}`;
  return message;
}

// ============ Helpers ======================================================= //

function isManagedExecutionFailure(status: RelayExecutionStatus): boolean {
  return status === RelayExecutionStatus.Failed || status === RelayExecutionStatus.Reverted;
}

function fallbackManagedExecutionFailureMessage(status: RelayExecutionStatus): string {
  return status === RelayExecutionStatus.Reverted ? 'Managed relay execution reverted' : 'Managed relay execution failed';
}
