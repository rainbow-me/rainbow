import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { useSetupContext } from '../setupContext';
import { cancelSetup, goBackInSetup } from '../setupNavigation';
import { SetupCancelButton } from './SetupCancelButton';
import { SetupProgressIndicator } from './SetupProgressIndicator';

export const SetupStepHeader = memo(function SetupStepHeader() {
  const { useActionStore } = useSetupContext();
  const insets = useSafeAreaInsets();
  const submitting = useActionStore(s => s.loading === true);

  const hasHistory = useStoreSharedValue(useCashDepositSetupNavigationStore, s => s.history.length > 0);
  const visible = useStoreSharedValue(useCashDepositSetupNavigationStore, s => !s.isRouteActive(Routes.CASH_SETUP_CARD_ADDED));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: visible.value ? 1 : 0,
    pointerEvents: visible.value ? 'box-none' : 'none',
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: hasHistory.value ? 1 : 0,
    pointerEvents: hasHistory.value ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={[styles.header, { top: insets.top + 24 }, headerStyle]}>
      <Animated.View style={backStyle}>
        <ButtonPressAnimation disabled={submitting} onPress={goBackInSetup} scaleTo={0.8} testID="cash-setup-back">
          <Box alignItems="center" background="fillTertiary" borderRadius={18} height={36} justifyContent="center" width={36}>
            <Text align="center" color="label" size="17pt" weight="heavy">
              {'􀆉'}
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Animated.View>

      <SetupProgressIndicator />

      <SetupCancelButton disabled={submitting} onPress={cancelSetup} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 36,
    justifyContent: 'space-between',
    left: 24,
    position: 'absolute',
    right: 24,
    zIndex: 1,
  },
});
