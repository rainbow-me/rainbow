import { type BivoSecureStore } from '@bivoglobal/payment-react-native';

import { IS_CASH_MOCK } from '@/env';
import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';
import { withTimeout } from '@/utils/promise';

import { MOCK_LINKED_CARD, type LinkedCard } from '../stores/cashPaymentMethodStore';
import { completeCardLinkSession, startCardLinkSession, type CardBrand } from './rampClient';

const BIVO_SUBMIT_TIMEOUT = time.seconds(30);

type BivoSubmitResult = { success: boolean; data?: { identifier?: string } };

function isBivoSubmitResult(value: unknown): value is BivoSubmitResult {
  return typeof value === 'object' && value !== null && typeof (value as { success?: unknown }).success === 'boolean';
}

// mimic behaviour of the `fetch` function, when aborted
function throwIfAborted(abortController: AbortController | null | undefined): void {
  if (!abortController?.signal.aborted) return;
  const error = new Error('Aborted');
  error.name = 'AbortError';
  throw error;
}

export async function linkCardWithVault(
  bivoStore: BivoSecureStore,
  cardBrand: CardBrand,
  abortController?: AbortController | null
): Promise<LinkedCard> {
  if (IS_CASH_MOCK) {
    await delay(time.seconds(3));
    return MOCK_LINKED_CARD;
  }

  const session = await startCardLinkSession(abortController);
  const result = await withTimeout(bivoStore.submit(session.token), BIVO_SUBMIT_TIMEOUT, 'Bivo vault submit timed out');
  // bivo SDK does not have a way to pass abort controller, so we check here manually
  throwIfAborted(abortController);
  if (!isBivoSubmitResult(result)) throw new Error('Bivo vault returned an unexpected response');
  if (!result.success) throw new Error('Bivo vault submit failed');
  const providerCardId = result.data?.identifier;
  if (!providerCardId) throw new Error('Bivo vault response is missing the provider card id');
  const card = await completeCardLinkSession({ brand: cardBrand, providerCardId }, abortController);
  return card;
}
