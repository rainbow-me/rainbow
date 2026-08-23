import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { AbsolutePortalRoot } from '@/components/AbsolutePortal';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SmoothPager } from '@/components/SmoothPager/SmoothPager';
import { Box } from '@/design-system';
import { useHardwareBackOnFocus } from '@/framework/ui/hooks/useHardwareBack';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { useCardLinkFlowStore } from '../../stores/cardLinkFlowStore';
import { getIsCashHalfSheetOpen } from '../../stores/cashHalfSheetVisibilityStore';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../stores/verifyPhoneFlowStore';
import { CashDepositSetupNavigation, CashDepositSetupNavigator, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { createSetupContext, SetupProvider } from './setupContext';
import { useIsSetupSubmittingStore } from './setupSubmittingStore';
import { SETUP_STEP_ORDER } from './steps';
import { AllDoneStep } from './steps/AllDoneStep';
import { CardAddedStep } from './steps/CardAddedStep';
import { CardDetailsStep } from './steps/CardDetailsStep';
import { ConfirmPhoneStep } from './steps/ConfirmPhoneStep';
import { IdentityStep } from './steps/IdentityStep';
import { PasskeyStep } from './steps/PasskeyStep';
import { PhoneStep } from './steps/PhoneStep';
import { ReviewStep } from './steps/ReviewStep';
import { SsnStep } from './steps/SsnStep';
import { useAddPasskeyFlowStore } from './steps/useAddPasskeyFlow';
import { useSubmitKycFlowStore } from './steps/useSubmitKycFlow';
import { useSubmitPhoneFlowStore } from './steps/useSubmitPhoneFlow';
import { useCashDepositSetupNavigation } from './useCashDepositSetupNavigation';

const STEP_COMPONENTS: Record<CashDepositSetupRoute, React.ReactElement> = {
  [Routes.CASH_SETUP_PHONE]: <PhoneStep />,
  [Routes.CASH_SETUP_CONFIRM_PHONE]: <ConfirmPhoneStep />,
  [Routes.CASH_SETUP_IDENTITY]: <IdentityStep />,
  [Routes.CASH_SETUP_SSN]: <SsnStep />,
  [Routes.CASH_SETUP_REVIEW]: <ReviewStep />,
  [Routes.CASH_SETUP_PASSKEY]: <PasskeyStep />,
  [Routes.CASH_SETUP_ALL_DONE]: <AllDoneStep />,
  [Routes.CASH_SETUP_CARD_DETAILS]: <CardDetailsStep />,
  [Routes.CASH_SETUP_CARD_ADDED]: <CardAddedStep />,
};

export const CashDepositSetupScreen = memo(function CashDepositSetupScreen() {
  const setup = useStableValue(createSetupContext);
  const { next, cancel } = useCashDepositSetupNavigation();

  useHardwareBackOnFocus(
    () => {
      if (useIsSetupSubmittingStore.getState() || getIsCashHalfSheetOpen()) return true;
      const { activeRoute, history } = useCashDepositSetupNavigationStore.getState();
      if (history.length) {
        CashDepositSetupNavigation.goBack();
      } else if (activeRoute === Routes.CASH_SETUP_CARD_ADDED) {
        next();
      } else {
        cancel();
      }
      return true;
    },
    false,
    [next, cancel]
  );

  useCleanup(() => {
    CashDepositSetupNavigation.resetNavigationState();
    useCashSetupSessionStore.getState().reset();
    useSubmitPhoneFlowStore.getState().reset();
    useVerifyPhoneFlowStore.getState().reset();
    useSubmitKycFlowStore.getState().reset();
    useAddPasskeyFlowStore.getState().reset();
    useCardLinkFlowStore.getState().reset();
  });

  return (
    <Box style={styles.container}>
      <SetupProvider value={setup}>
        {useStableValue(() => (
          <SmoothPager
            enableSwipeToGoBack={false}
            enableSwipeToGoForward={false}
            lazy
            navigation={CashDepositSetupNavigator.Pager}
            onPageActivated={setup.focusInput}
            scaleTo={1}
            springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
          >
            {SETUP_STEP_ORDER.map(route => (
              <SmoothPager.Page id={route} key={route}>
                <CashDepositSetupNavigator.Route name={route}>{STEP_COMPONENTS[route]}</CashDepositSetupNavigator.Route>
              </SmoothPager.Page>
            ))}
          </SmoothPager>
        ))}
      </SetupProvider>
      <AbsolutePortalRoot />
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
