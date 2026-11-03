import { isCashAccessRefusedError } from './cashAccessRefusal';
import { isPasskeyCancellation } from './cashPasskeyService';

/**
 * Errors whose reason the user has already been shown: a cancelled passkey prompt, or the
 * access-refusal notice sheet. Flows return to their resting state without logging or alerting.
 */
export function isHandledCashError(error: unknown): boolean {
  return isCashAccessRefusedError(error) || isPasskeyCancellation(error);
}
