import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getPasskeyAssertion, isPasskeyCancellation } from './cashPasskeyService';
import { finalizeAuth, finishLogin, startLogin } from './userClient';

export type CashSignInTrigger = 'cardLink' | 'addCash';

const TOKEN_EXPIRY_MARGIN = time.seconds(30);

let pendingSignIn: Promise<string> | null = null;

function getCachedAccessToken(): string | null {
  const token = useCashAuthTokenStore.getState().token;
  if (!token) return null;
  const remaining = token.expiresAt - Date.now();
  return remaining > TOKEN_EXPIRY_MARGIN ? token.accessToken : null;
}

export async function ensureAccessToken(trigger: CashSignInTrigger): Promise<string> {
  const cached = getCachedAccessToken();
  if (cached) return cached;

  // Concurrent callers join the same ceremony instead of stacking passkey prompts
  pendingSignIn ??= signIn(trigger).finally(() => {
    pendingSignIn = null;
  });
  return pendingSignIn;
}

async function signIn(trigger: CashSignInTrigger): Promise<string> {
  analytics.track(analytics.event.cashSignInSubmitted, { trigger });
  try {
    const userId = useCashAccountStore.getState().userId;
    if (!userId) throw new Error('No cash account recorded on this device');

    const start = await startLogin({ userId });
    const credentialAssertionJson = await getPasskeyAssertion(start.publicKeyOptionsJson);
    const finish = await finishLogin({ sessionId: start.sessionId, sessionToken: start.sessionToken, credentialAssertionJson });
    const token = await finalizeAuth({ sessionId: finish.sessionId, sessionToken: finish.sessionToken });

    useCashAuthTokenStore.getState().setToken(token);
    analytics.track(analytics.event.cashSignInSucceeded, { trigger });
    return token.accessToken;
  } catch (error) {
    if (isPasskeyCancellation(error)) {
      analytics.track(analytics.event.cashSignInCancelled, { trigger });
    } else {
      analytics.track(analytics.event.cashSignInFailed, { trigger, reason: error instanceof Error ? error.message : String(error) });
    }
    throw error;
  }
}
