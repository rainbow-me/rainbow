import React, { memo, useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { useListen } from '@storesjs/stores';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { Box, useBackgroundColor } from '@/design-system';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute, type RootStackParamList } from '@/navigation/types';

import { useCashDepositSetupStore } from '../../stores/cashDepositSetupStore';
import { CashDepositSetupNavigation, CashDepositSetupNavigator, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { getFirstSetupStep, SETUP_STEP_ORDER } from './steps';
import { AllDoneStep } from './steps/AllDoneStep';
import { CardDetailsStep } from './steps/CardDetailsStep';
import { ConfirmPhoneStep } from './steps/ConfirmPhoneStep';
import { EmailStep } from './steps/EmailStep';
import { IdentityStep } from './steps/IdentityStep';
import { PasskeyStep } from './steps/PasskeyStep';
import { PhoneStep } from './steps/PhoneStep';
import { ReviewStep } from './steps/ReviewStep';
import { SsnStep } from './steps/SsnStep';

const STEP_COMPONENTS: Record<CashDepositSetupRoute, React.ReactElement> = {
  [Routes.CASH_SETUP_PHONE]: <PhoneStep />,
  [Routes.CASH_SETUP_CONFIRM_PHONE]: <ConfirmPhoneStep />,
  [Routes.CASH_SETUP_IDENTITY]: <IdentityStep />,
  [Routes.CASH_SETUP_SSN]: <SsnStep />,
  [Routes.CASH_SETUP_REVIEW]: <ReviewStep />,
  [Routes.CASH_SETUP_PASSKEY]: <PasskeyStep />,
  [Routes.CASH_SETUP_EMAIL]: <EmailStep />,
  [Routes.CASH_SETUP_ALL_DONE]: <AllDoneStep />,
  [Routes.CASH_SETUP_CARD_DETAILS]: <CardDetailsStep />,
};

export const CashDepositSetupScreen = memo(function CashDepositSetupScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.CASH_DEPOSIT_SETUP_SCREEN>>();
  const { ref, goToPage } = usePagerNavigation();
  const backgroundColor = useBackgroundColor('surfacePrimary');
  const initialPage = useStableValue(
    () => params?.initialStep ?? getFirstSetupStep(useCashDepositSetupStore.getState().facts) ?? SETUP_STEP_ORDER[0].id
  );

  // onNewIndex doesn't fire on mount, so seed the navigator with the page the pager opens on.
  useLayoutEffect(() => {
    useCashDepositSetupNavigationStore.setState({ activeRoute: initialPage, history: [] });
  }, [initialPage]);

  useListen(
    useCashDepositSetupNavigationStore,
    state => state.activeRoute,
    route => goToPage(route)
  );

  useCleanup(CashDepositSetupNavigation.resetNavigationState);

  return (
    <Box backgroundColor={backgroundColor} style={styles.container}>
      {useStableValue(() => (
        <SmoothPager
          enableSwipeToGoBack
          initialPage={initialPage}
          lazy
          onNewIndex={CashDepositSetupNavigator.handlePagerIndexChange}
          ref={ref}
          scaleTo={1}
          springConfig={SPRING_CONFIGS.snappyMediumSpringConfig}
        >
          {SETUP_STEP_ORDER.map(step => (
            <SmoothPager.Page
              component={<CashDepositSetupNavigator.Route name={step.id}>{STEP_COMPONENTS[step.id]}</CashDepositSetupNavigator.Route>}
              id={step.id}
              key={step.id}
            />
          ))}
        </SmoothPager>
      ))}
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
