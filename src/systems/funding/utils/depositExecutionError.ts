import { type DepositLabels } from '../types';

const NOISY_RPC_ERROR_PATTERNS = [
  'eth_sendRawTransaction',
  'eth_estimateGas',
  'links.ethers.org',
  'requestBody',
  'SERVER_ERROR',
  'UNPREDICTABLE_GAS_LIMIT',
];

/**
 * Converts provider and wallet execution errors into messages suitable for user-facing deposit alerts.
 */
export function formatDepositExecutionError(error: unknown, labels: DepositLabels): string {
  const message = extractErrorMessage(error);
  if (isInsufficientFundsError(error, message)) return labels.insufficientGas;
  if (!message || NOISY_RPC_ERROR_PATTERNS.some(pattern => message.includes(pattern))) return labels.unknownExecutionError;
  return message;
}

function isInsufficientFundsError(error: unknown, message: string | null): boolean {
  const code = extractErrorCode(error);
  return (
    code === 'INSUFFICIENT_FUNDS' ||
    containsMessage(error, 'insufficient funds') ||
    Boolean(message?.toLowerCase().includes('insufficient funds'))
  );
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (!isRecord(error)) return null;

  const message = error.message;
  if (typeof message === 'string') return message;

  return extractErrorMessage(error.error);
}

function extractErrorCode(error: unknown): string | null {
  if (!isRecord(error)) return null;

  const code = error.code;
  if (typeof code === 'string') return code;

  return extractErrorCode(error.error);
}

function containsMessage(error: unknown, fragment: string): boolean {
  const message = extractErrorMessage(error);
  if (message?.toLowerCase().includes(fragment)) return true;
  return isRecord(error) ? containsMessage(error.error, fragment) : false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
