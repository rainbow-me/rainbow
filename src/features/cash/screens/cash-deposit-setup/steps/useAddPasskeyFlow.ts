import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { isCashAccessRefusedError } from '../../../services/cashAccessRefusal';
import { isHandledCashError } from '../../../services/cashHandledError';
import {
  createPasskeyCredential,
  getPasskeyName,
  isPasskeyAlreadyOnDevice,
  isPasskeyCancellation,
} from '../../../services/cashPasskeyService';
import { signInWithPhone } from '../../../services/cashSignInService';
import { addPasskey, finishAddPasskey } from '../../../services/userClient';
import { useCashAccountStore } from '../../../stores/cashAccountStore';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { getTelemetryErrorReason } from '../../../utils/getTelemetryErrorReason';

export type AddPasskeyState = 'entry' | 'submitting' | 'error' | 'passkeyOnDevice' | 'signingIn';

export type AddPasskeyResult = 'completed' | 'recovered' | 'cancelled' | 'failed' | 'skipped';

type AddPasskeyFlowStore = {
  state: AddPasskeyState;
  reset: () => void;
  submit: () => Promise<AddPasskeyResult>;
  signInWithPasskeyOnDevice: () => Promise<'signedIn' | 'cancelled' | 'failed'>;
};

export function selectIsPasskeyCeremonyPending({ state }: { state: AddPasskeyState }): boolean {
  return state === 'submitting' || state === 'signingIn';
}

export const useAddPasskeyFlowStore = createBaseStore<AddPasskeyFlowStore>((set, get) => ({
  state: 'entry',

  reset: () => set({ state: 'entry' }),

  submit: async () => {
    if (selectIsPasskeyCeremonyPending(get())) return 'skipped';
    const { session } = useCashSetupSessionStore.getState();
    if (session.status !== 'phoneVerified') return 'skipped';
    const recovering = session.source === 'recovery';

    set({ state: 'submitting' });
    analytics.track(analytics.event.cashPasskeySubmitted);
    try {
      const { bootstrapToken } = session;
      const { passkeyId, publicKeyOptionsJson, userId } = await addPasskey({ bootstrapToken });
      const credentialCreationJson = await createPasskeyCredential(publicKeyOptionsJson);
      await finishAddPasskey({ bootstrapToken, passkeyId, credentialCreationJson, passkeyName: getPasskeyName() });

      useCashAccountStore.getState().setUserId(userId);
      analytics.track(analytics.event.cashPasskeyAdded);

      set({ state: 'entry' });
      return recovering ? 'recovered' : 'completed';
    } catch (e) {
      if (isCashAccessRefusedError(e)) {
        set({ state: 'entry' });
        return 'failed';
      }
      if (isPasskeyCancellation(e)) {
        set({ state: 'entry' });
        return 'cancelled';
      }
      if (isPasskeyAlreadyOnDevice(e)) {
        set({ state: 'passkeyOnDevice' });
        return 'failed';
      }
      logger.error(new RainbowError('[useAddPasskeyFlow]: Failed to add passkey', e));
      analytics.track(analytics.event.cashPasskeyFailed, { reason: getTelemetryErrorReason(e) });
      set({ state: 'error' });
      return 'failed';
    }
  },

  // The passkey already on the device belongs to this account, so it signs in where enrolling another
  // cannot. Cancelling or failing leaves the prompt in place for a retry.
  signInWithPasskeyOnDevice: async () => {
    const { session } = useCashSetupSessionStore.getState();
    if (get().state !== 'passkeyOnDevice' || session.status !== 'phoneVerified') return 'failed';

    set({ state: 'signingIn' });
    try {
      await signInWithPhone(session.phoneNationalNumber, 'passkeyOnDevicePrompt');
      set({ state: 'entry' });
      return 'signedIn';
    } catch (e) {
      set({ state: 'passkeyOnDevice' });
      if (isHandledCashError(e)) return 'cancelled';
      logger.error(new RainbowError('[useAddPasskeyFlow]: Failed to sign in with the passkey on this device', e));
      return 'failed';
    }
  },
}));
