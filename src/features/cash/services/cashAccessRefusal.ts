import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashAccessRefusalStore, type CashAccessRefusalReason } from '../stores/cashAccessRefusalStore';

const NETWORK_POLICY_ERROR_CODES = new Set([600, 601, 602]);
export const USER_ACCESS_BLOCKED = 1340;

export class CashAccessRefusedError extends Error {
  constructor(
    readonly reason: CashAccessRefusalReason,
    readonly cause?: unknown
  ) {
    super(`Cash access refused: ${reason}`);
    this.name = 'CashAccessRefusedError';
  }
}

export function isCashAccessRefusedError(error: unknown): error is CashAccessRefusedError {
  return error instanceof CashAccessRefusedError;
}

export function refuseCashAccess(reason: CashAccessRefusalReason, cause?: unknown): never {
  useCashAccessRefusalStore.getState().show(reason);
  throw new CashAccessRefusedError(reason, cause);
}

export function handleCashUserServiceError(error: unknown): never {
  if (error instanceof RainbowFetchError) {
    const code = error.responseBody?.code;
    if (error.response?.status === 403 && NETWORK_POLICY_ERROR_CODES.has(code)) refuseCashAccess('networkPolicy', error);
    if (code === USER_ACCESS_BLOCKED) refuseCashAccess('unavailable', error);
  }
  throw error;
}
