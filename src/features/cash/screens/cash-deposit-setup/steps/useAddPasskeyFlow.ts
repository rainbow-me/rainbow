import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { createPasskeyCredential, getPasskeyName, isPasskeyCancellation } from '../../../services/cashPasskeyService';
import { listCards } from '../../../services/rampClient';
import { addPasskey, finishAddPasskey } from '../../../services/userClient';
import { useCashAccountStore } from '../../../stores/cashAccountStore';
import { useCashPaymentMethodStore } from '../../../stores/cashPaymentMethodStore';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { getTelemetryErrorReason } from '../../../utils/getTelemetryErrorReason';

export type AddPasskeyState = 'entry' | 'submitting' | 'error';

export type AddPasskeyResult = 'completed' | 'recovered' | 'cancelled' | 'failed' | 'skipped';

type AddPasskeyFlowStore = {
  state: AddPasskeyState;
  reset: () => void;
  submit: () => Promise<AddPasskeyResult>;
};

export const useAddPasskeyFlowStore = createBaseStore<AddPasskeyFlowStore>((set, get) => ({
  state: 'entry',

  reset: () => set({ state: 'entry' }),

  submit: async () => {
    if (get().state === 'submitting') return 'skipped';
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

      if (session.source !== 'signup') {
        try {
          const [card] = await listCards({ trigger: session.source });
          if (card) useCashPaymentMethodStore.getState().setLinkedCard(card);
        } catch (error) {
          if (!isPasskeyCancellation(error)) {
            logger.error(new RainbowError('[useAddPasskeyFlow]: Failed to restore linked card', error));
          }
        }
      }

      set({ state: 'entry' });
      return recovering ? 'recovered' : 'completed';
    } catch (e) {
      if (isPasskeyCancellation(e)) {
        set({ state: 'entry' });
        return 'cancelled';
      }
      logger.error(new RainbowError('[useAddPasskeyFlow]: Failed to add passkey', e));
      analytics.track(analytics.event.cashPasskeyFailed, { reason: getTelemetryErrorReason(e) });
      set({ state: 'error' });
      return 'failed';
    }
  },
}));
