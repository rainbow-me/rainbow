import { type BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createDerivedStore, shallowEqual, type BaseStore } from '@storesjs/stores';

import { OTP_LENGTH, useVerifyPhoneFlowStore } from '@/features/cash/stores/verifyPhoneFlowStore';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { CardBrand } from '../../services/rampClient';
import { useCardLinkFlowStore } from '../../stores/cardLinkFlowStore';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { NATIONAL_NUMBER_LENGTH } from '../../utils/phoneNumber';
import { useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { completeSetupStep, goBackInSetup } from './setupNavigation';
import { isSetupEditDetour } from './steps';
import { useAddPasskeyFlowStore } from './steps/useAddPasskeyFlow';
import { useSubmitKycFlowStore } from './steps/useSubmitKycFlow';
import { useSubmitPhoneFlowStore } from './steps/useSubmitPhoneFlow';

type SetupAction = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  shadow?: boolean;
};

async function submitPhone(): Promise<void> {
  if (await useSubmitPhoneFlowStore.getState().submit()) completeSetupStep();
}

export async function submitPhoneCode(): Promise<void> {
  const result = await useVerifyPhoneFlowStore.getState().submit();
  if (result === 'verified') completeSetupStep();
  else if (result === 'signupAlreadyComplete') goBackInSetup();
}

export async function submitPasskey(): Promise<void> {
  if ((await useAddPasskeyFlowStore.getState().submit()) === 'completed') completeSetupStep();
}

export function createSetupActionStore(getCardForm: () => BivoSecureStore, cardFormStore: BaseStore<{ isReady: boolean }>) {
  async function linkCard(): Promise<void> {
    if (!cardFormStore.getState().isReady) return;
    if ((await useCardLinkFlowStore.getState().submit(getCardForm(), CardBrand.Visa)) === 'completed') {
      completeSetupStep();
    }
  }

  const labels: Partial<Record<CashDepositSetupRoute, string>> = {
    [Routes.CASH_SETUP_CONFIRM_PHONE]: i18n.t(i18n.l.cash.deposit_setup.confirm_phone.confirm),
    [Routes.CASH_SETUP_REVIEW]: i18n.t(i18n.l.cash.deposit_setup.review.confirm),
    [Routes.CASH_SETUP_PASSKEY]: i18n.t(i18n.l.cash.deposit_setup.passkey.action),
    [Routes.CASH_SETUP_ALL_DONE]: i18n.t(i18n.l.cash.deposit_setup.all_done.add_bank_card),
    [Routes.CASH_SETUP_CARD_ADDED]: i18n.t(i18n.l.cash.deposit_setup.finish),
  };

  const nextLabel = i18n.t(i18n.l.cash.deposit_setup.next);
  const doneLabel = i18n.t(i18n.l.button.done);

  return createDerivedStore<SetupAction>($ => {
    const activeRoute = $(useCashDepositSetupNavigationStore, s => s.activeRoute);

    const label = $(useCashDepositSetupNavigationStore, s => {
      if (isSetupEditDetour(s.activeRoute, s.history.at(-1))) return doneLabel;
      return labels[s.activeRoute] ?? nextLabel;
    });

    switch (activeRoute) {
      case Routes.CASH_SETUP_PHONE: {
        const disabled = $(useSubmitPhoneFlowStore, s => s.digits.length !== NATIONAL_NUMBER_LENGTH);
        const loading = $(useSubmitPhoneFlowStore, s => s.state === 'submitting');
        return { disabled, label, loading, onPress: submitPhone };
      }

      case Routes.CASH_SETUP_CONFIRM_PHONE: {
        const state = $(useVerifyPhoneFlowStore, s => s.state);
        const isFullCode = $(useVerifyPhoneFlowStore, s => s.code.length === OTP_LENGTH);
        return {
          disabled: !isFullCode || state === 'verified',
          label,
          loading: state === 'verifying',
          onPress: submitPhoneCode,
        };
      }

      case Routes.CASH_SETUP_IDENTITY:
        return { disabled: $(useCashSetupSessionStore, s => s.getIdentity() === null), label, onPress: completeSetupStep };

      case Routes.CASH_SETUP_SSN:
        return { disabled: $(useCashSetupSessionStore, s => s.getGovernmentId() === null), label, onPress: completeSetupStep };

      case Routes.CASH_SETUP_REVIEW: {
        const isReady = $(useCashSetupSessionStore, s => s.getIdentity() !== null && s.getGovernmentId() !== null);
        const state = $(useSubmitKycFlowStore, s => s.state);
        return {
          disabled: !isReady || state !== 'entry',
          label,
          loading: state === 'submitting',
          onPress: useSubmitKycFlowStore.getState().submit,
        };
      }

      case Routes.CASH_SETUP_PASSKEY:
        return {
          label,
          loading: $(useAddPasskeyFlowStore, s => s.state === 'submitting'),
          onPress: submitPasskey,
        };

      case Routes.CASH_SETUP_CARD_DETAILS: {
        const isReady = $(cardFormStore, s => s.isReady);
        const state = $(useCardLinkFlowStore, s => s.state);
        return { disabled: !isReady || state !== 'entry', label, loading: state === 'submitting', onPress: linkCard };
      }

      case Routes.CASH_SETUP_ALL_DONE:
      case Routes.CASH_SETUP_CARD_ADDED:
        return { label, onPress: completeSetupStep, shadow: true };

      case Routes.CASH_SETUP_EMAIL:
        return { label, onPress: completeSetupStep };
    }
  }, shallowEqual);
}
