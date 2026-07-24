import { useCallback } from 'react';

import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';

import { createPasskeyCredential, getPasskeyName, isPasskeyCancellation } from '../../../services/cashPasskeyService';
import { addPasskey, finishAddPasskey } from '../../../services/userClient';
import { useCashDepositSetupStore } from '../../../stores/cashDepositSetupStore';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

export type AddPasskeyState = 'entry' | 'submitting';

export type AddPasskeyResult = 'completed' | 'cancelled' | 'failed' | 'skipped';

type AddPasskeyFlowStore = {
  state: AddPasskeyState;
  submit: () => Promise<AddPasskeyResult>;
};

export const useAddPasskeyFlowStore = createBaseStore<AddPasskeyFlowStore>((set, get) => ({
  state: 'entry',

  submit: async () => {
    if (get().state !== 'entry') return 'skipped';
    const { session } = useCashSetupSessionStore.getState();
    if (session.status !== 'phoneVerified') return 'skipped';

    set({ state: 'submitting' });
    analytics.track(analytics.event.cashPasskeySubmitted);
    try {
      const { bootstrapToken } = session;
      const { passkeyId, publicKeyOptionsJson } = await addPasskey({ bootstrapToken });
      const credentialCreationJson = await createPasskeyCredential(publicKeyOptionsJson);
      await finishAddPasskey({ bootstrapToken, passkeyId, credentialCreationJson, passkeyName: getPasskeyName() });

      useCashDepositSetupStore.getState().setFact('passkeyRegistered', true);
      analytics.track(analytics.event.cashPasskeyAdded);
      return 'completed';
    } catch (e) {
      if (isPasskeyCancellation(e)) return 'cancelled';
      logger.error(new RainbowError('[useAddPasskeyFlow]: Failed to add passkey', e));
      analytics.track(analytics.event.cashPasskeyFailed, { reason: e instanceof Error ? e.message : String(e) });
      return 'failed';
    } finally {
      set({ state: 'entry' });
    }
  },
}));

const addPasskeyFlowActions = createStoreActions(useAddPasskeyFlowStore);

export function useAddPasskeyFlow(): { submitting: boolean; submit: () => Promise<void> } {
  const { next } = useCashDepositSetupNavigation();
  const submitting = useAddPasskeyFlowStore(state => state.state === 'submitting');

  const submit = useCallback(async () => {
    const result = await addPasskeyFlowActions.submit();
    if (result === 'completed') next();
    else if (result === 'failed') Alert.alert(i18n.t(i18n.l.cash.deposit_setup.passkey.error));
  }, [next]);

  return { submitting, submit };
}
