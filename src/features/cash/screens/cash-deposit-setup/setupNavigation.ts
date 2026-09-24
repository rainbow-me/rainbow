import { goBack, navigate } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useNavigationStore, type NavigationState } from '@/state/navigation/navigationStore';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { useVerifyPhoneFlowStore } from '../../stores/verifyPhoneFlowStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { getNextSetupStep, isSetupEditDetour } from './steps';
import { useAddPasskeyFlowStore } from './steps/useAddPasskeyFlow';
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
  if (session.status === 'phoneVerified' && useSubmitReviewFlowStore.getState().state === 'submitting') {
    sessionStore.markKycSubmitted(session.bootstrapToken);
  }
  const keep =
    session.status === 'phoneVerified' &&
    session.source !== 'recovery' &&
    selectIsPhoneVerified(sessionStore) &&
    useCashAccountStore.getState().userId == null &&
    !hasTerminalKycRejection();
  if (!keep) sessionStore.reset();
}

export function abandonSetupSession(): void {
  useCashSetupSessionStore.getState().reset();
}

// A session can also clear while Setup stays mounted: the bootstrap credential expiring mid-flow.
// The wizard would otherwise keep a step that needed it, whose action then silently no-ops.
export function restartSetupWithoutCredential(): void {
  if (useCashSetupSessionStore.getState().session.status !== 'empty') return;
  if (useCashAccountStore.getState().userId != null) return;
  if (useAddPasskeyFlowStore.getState().state === 'submitting') return;
  if (CashDepositSetupNavigation.isRouteActive(Routes.CASH_SETUP_PHONE)) return;

  const isActive = selectIsSetupScreenActive(useNavigationStore.getState());

  useVerifyPhoneFlowStore.getState().reset();
  useSubmitReviewFlowStore.getState().reset();
  useKycReturnFlowStore.getState().reset();
  useAddPasskeyFlowStore.getState().reset();

  CashDepositSetupNavigation.resetNavigationState();
  if (isActive) CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_PHONE);
}

/** Matches Setup's native screen on entry/dismissal, or its active step after virtual navigation. */
export function selectIsSetupScreenActive({ isRouteActive }: NavigationState): boolean {
  return isRouteActive(Routes.CASH_DEPOSIT_SETUP_SCREEN) || isRouteActive(useCashDepositSetupNavigationStore.getState().activeRoute);
}

function hasTerminalKycRejection(): boolean {
  return (
    isTerminalKycRejection(useSubmitReviewFlowStore.getState().state) ||
    isTerminalKycRejection(useVerifyPhoneFlowStore.getState().kycOutcome) ||
    isTerminalKycRejection(useKycReturnFlowStore.getState().state)
  );
}

function isTerminalKycRejection(outcome: string | null): boolean {
  return outcome === 'rejected' || outcome === 'unsupportedState';
}
