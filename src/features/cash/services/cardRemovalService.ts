import { isHandledCashError } from './cashHandledError';
import { deleteCard, isDefinitiveRejection, isNotFoundError, listCards } from './rampClient';

export async function removeLinkedCard(cardId: string): Promise<void> {
  try {
    await deleteCard(cardId);
  } catch (error) {
    // 404 is also a definitive rejection, so it has to be read as "already gone" first.
    if (isNotFoundError(error)) return;
    // A cancelled sign-in or policy block has already reached the user, so there is nothing to reconcile.
    if (isHandledCashError(error) || isDefinitiveRejection(error)) throw error;
    if (await isCardGone(cardId)) return;
    throw error;
  }
}

async function isCardGone(cardId: string): Promise<boolean> {
  try {
    return !(await listCards({ trigger: 'addCash' })).some(card => card.id === cardId);
  } catch {
    return false;
  }
}
