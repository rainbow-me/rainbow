import { logger, RainbowError } from '@/logger';

import { useCashAuthGateStore, type CashAuthIntent } from '../stores/cashAuthGateStore';
import { cashBuyOrderActions, selectCashBuyPhase, useCashBuyOrderStore } from '../stores/cashBuyOrderStore';
import { loadLinkedCards } from './cardListService';
import { isPasskeyCancellation } from './cashPasskeyService';
import { ensureAccessToken } from './cashSignInService';

type CashAuthGateResumeResult = 'completed' | 'authRequired';

const RESUME_BY_INTENT: Record<CashAuthIntent['kind'], () => Promise<CashAuthGateResumeResult>> = {
  loadCards: loadLinkedCards,
  resumeOrder: cashBuyOrderActions.resumeOrder,
};

/** Sheet entry: run what belongs behind the gate; the gate only opens if that needs a fresh sign-in. */
export function openCashAuthGate(): Promise<void> {
  // An unresolved order outranks the card list: probing needs only the token, and the cards can load
  // once the amount screen actually shows.
  const hasPendingOrder = selectCashBuyPhase(useCashBuyOrderStore.getState()) === 'pending';
  return runIntent({ kind: hasPendingOrder ? 'resumeOrder' : 'loadCards' });
}

/** The user's Re-authenticate tap: one announced ceremony, then the parked intent continues. */
export async function reauthenticateCashGate(): Promise<void> {
  const gate = useCashAuthGateStore.getState();
  const parked = gate.status;
  if (parked.step === 'closed') return;
  // Dismissing the sheet while the ceremony is up clears the gate; a stale outcome must not reopen it.
  const isCurrent = () => useCashAuthGateStore.getState().status === parked;

  try {
    await ensureAccessToken('addCash');
  } catch (error) {
    // A cancelled sign-in is a deliberate dismissal, not a failure: stay parked, silently.
    if (isPasskeyCancellation(error)) return;
    logger.error(new RainbowError('[cashAuthGateService]: Failed to re-authenticate', error));
    if (isCurrent()) gate.fail(parked.intent);
    return;
  }
  if (isCurrent()) await runIntent(parked.intent);
}

async function runIntent(intent: CashAuthIntent): Promise<void> {
  const gate = useCashAuthGateStore.getState();
  gate.clear();
  // Dismissing the sheet (or a newer run) clears the gate again; a stale completion must not reopen it.
  const cleared = useCashAuthGateStore.getState().status;
  const isCurrent = () => useCashAuthGateStore.getState().status === cleared;
  try {
    const result = await RESUME_BY_INTENT[intent.kind]();
    if (result === 'authRequired' && isCurrent()) gate.park(intent);
  } catch (error) {
    logger.error(new RainbowError(`[cashAuthGateService]: ${intent.kind} failed`, error));
    if (isCurrent()) gate.fail(intent);
  }
}
