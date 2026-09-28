import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashUserServiceNetworkPolicyStore } from '../stores/cashUserServiceNetworkPolicyStore';

const NETWORK_POLICY_ERROR_CODES = new Set([600, 601, 602]);

export class CashUserServiceNetworkPolicyError extends Error {
  constructor(readonly cause: RainbowFetchError) {
    super('Cash UserService request blocked by network policy');
    this.name = 'CashUserServiceNetworkPolicyError';
  }
}

export function isCashUserServiceNetworkPolicyError(error: unknown): error is CashUserServiceNetworkPolicyError {
  return error instanceof CashUserServiceNetworkPolicyError;
}

export function handleCashUserServiceError(error: unknown): never {
  if (error instanceof RainbowFetchError && error.response?.status === 403 && NETWORK_POLICY_ERROR_CODES.has(error.responseBody?.code)) {
    useCashUserServiceNetworkPolicyStore.getState().show();
    throw new CashUserServiceNetworkPolicyError(error);
  }
  throw error;
}
