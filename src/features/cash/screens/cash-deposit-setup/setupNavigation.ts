import { goBack, navigate } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { useVerifyPhoneFlowStore } from '../../stores/verifyPhoneFlowStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { getNextSetupStep, isSetupEditDetour } from './steps';
import { useSubmitReviewFlowStore } from './steps/useSubmitReviewFlow';

export function completeSetupStep(): void {
  const { activeRoute, history } = useCashDepositSetupNavigationStore.getState();
  if (isSetupEditDetour(activeRoute, history.at(-1))) {
    CashDepositSetupNavigation.goBack();
    return;
  }

  const nextRoute = getNextSetupStep(activeRoute);
  if (nextRoute) {
    CashDepositSetupNavigation.navigate(nextRoute);
    return;
  }

  completeSetup();
}

export function completeSetup(): void {
  goBack();
  navigate(Routes.ADD_CASH_SHEET);
}

export function cancelSetup(): void {
  const hasPasskey = useCashAccountStore.getState().userId != null;
  const { status } = useCashSetupSessionStore.getState().session;
  if (!hasPasskey && (status === 'phoneSubmitted' || status === 'recovery' || status === 'phoneVerified')) {
    navigate(Routes.CASH_SETUP_CANCEL_SHEET);
  } else {
    goBack();
  }
}

export function goBackInSetup(): void {
  if (useCashDepositSetupNavigationStore.getState().history.length) CashDepositSetupNavigation.goBack();
  else cancelSetup();
}

// A live signup bootstrap token outlives Setup so a prompt return skips phone + OTP. A recovered
// account's token only enrols the passkey, an enrolled account no longer needs one, and a rejected
// verdict is terminal.
export function endSetupSession(): void {
  const sessionStore = useCashSetupSessionStore.getState();
  const { session } = sessionStore;
  const keep =
    session.status === 'phoneVerified' &&
    session.source !== 'recovery' &&
    selectIsPhoneVerified(sessionStore) &&
    useCashAccountStore.getState().userId == null &&
    !isKycRejected();
  if (!keep) sessionStore.reset();
}

export function abandonSetupSession(): void {
  useCashSetupSessionStore.getState().reset();
}

function isKycRejected(): boolean {
  return (
    useSubmitReviewFlowStore.getState().state === 'rejected' ||
    useVerifyPhoneFlowStore.getState().kycOutcome === 'rejected' ||
    useKycReturnFlowStore.getState().state === 'rejected'
  );
}
