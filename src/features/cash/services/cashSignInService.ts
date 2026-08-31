import { analytics } from '@/analytics';
import { time } from '@/framework/core/utils/time';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getTelemetryErrorReason } from '../utils/getTelemetryErrorReason';
import { US_COUNTRY_CALLING_CODE } from '../utils/phoneNumber';
import { getPasskeyAssertion, isPasskeyCancellation } from './cashPasskeyService';
import { finalizeAuth, finishLogin, startLogin, type StartLoginParams } from './userClient';

export type CashSignInTrigger = 'cardLink' | 'addCash' | 'signInScreen' | 'recovery' | 'resume';

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
  pendingSignIn ??= runLoginCeremony(trigger, storedAccountIdentifier).finally(() => {
    pendingSignIn = null;
  });
  return pendingSignIn;
}

function storedAccountIdentifier(): StartLoginParams {
  const userId = useCashAccountStore.getState().userId;
  if (!userId) throw new Error('No cash account recorded on this device');
  return { userId };
}

// The identifier is resolved inside the try so a missing account record reports through the same funnel.
async function runLoginCeremony(trigger: CashSignInTrigger, resolveIdentifier: () => StartLoginParams): Promise<string> {
  analytics.track(analytics.event.cashSignInSubmitted, { trigger });
  try {
    const start = await startLogin(resolveIdentifier());
    const credentialAssertionJson = await getPasskeyAssertion(start.publicKeyOptionsJson);
    const finish = await finishLogin({ sessionId: start.sessionId, sessionToken: start.sessionToken, credentialAssertionJson });

    // setUserId drops account-scoped state when the record changes, so it must precede setToken.
    useCashAccountStore.getState().setUserId(finish.userId);
    const token = await finalizeAuth({ sessionId: finish.sessionId, sessionToken: finish.sessionToken });

    useCashAuthTokenStore.getState().setToken(token);
    analytics.track(analytics.event.cashSignInSucceeded, { trigger });
    return token.accessToken;
  } catch (error) {
    if (isPasskeyCancellation(error)) {
      analytics.track(analytics.event.cashSignInCancelled, { trigger });
    } else {
      analytics.track(analytics.event.cashSignInFailed, { trigger, reason: getTelemetryErrorReason(error) });
    }
    throw error;
  }
}

// Signs in a device with no stored account: the phone number identifies the user instead.
export async function signInWithPhone(nationalNumber: string): Promise<void> {
  await runLoginCeremony('signInScreen', () => ({ phone: { countryCode: US_COUNTRY_CALLING_CODE, nationalNumber } }));
}
