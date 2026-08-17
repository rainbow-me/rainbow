import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AbsolutePortalRoot } from '@/components/AbsolutePortal';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SmoothPager } from '@/components/SmoothPager/SmoothPager';
import { Box, useBackgroundColor } from '@/design-system';
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
import { SetupActionButton } from './components/SetupActionButton';
import { SetupStepHeader } from './components/SetupStepHeader';
import { createSetupContext, SetupProvider } from './setupContext';
import { cancelSetup, completeSetupStep } from './setupNavigation';
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
  const insets = useSafeAreaInsets();
  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const setup = useStableValue(createSetupContext);

  useHardwareBackOnFocus(
    () => {
      if (setup.useActionStore.getState().loading || getIsCashHalfSheetOpen()) return true;
      const { activeRoute, history } = useCashDepositSetupNavigationStore.getState();
      if (history.length) {
        CashDepositSetupNavigation.goBack();
      } else if (activeRoute === Routes.CASH_SETUP_CARD_ADDED) {
        completeSetupStep();
      } else {
        cancelSetup();
      }
      return true;
    },
    false,
    []
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
      <KeyboardAvoidingView
        behavior="padding"
        // The resting CTA uses the safe-area inset; the open-keyboard gap is 20 points.
        keyboardVerticalOffset={20 - insets.bottom}
        style={[styles.keyboardAvoidingView, { backgroundColor: surfacePrimaryElevated }]}
      >
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
          <SetupStepHeader />
          <SetupActionButton />
        </SetupProvider>
      </KeyboardAvoidingView>
      <AbsolutePortalRoot />
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
});
