import { isPasskeyCancellation } from './cashPasskeyService';
import { isCashUserServiceNetworkPolicyError } from './cashUserServiceNetworkPolicy';

/**
 * Errors whose reason the user has already been shown: a cancelled passkey prompt, or the
 * network-policy warning sheet. Flows return to their resting state without logging or alerting.
 */
export function isHandledCashError(error: unknown): boolean {
  return isCashUserServiceNetworkPolicyError(error) || isPasskeyCancellation(error);
}
