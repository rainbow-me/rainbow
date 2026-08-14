import { memo } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, useForegroundColor } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { SETUP_STEP_ORDER } from '../steps';

const INDICATOR_HEIGHT = 8;
const INDICATOR_WIDTH = 96;

const FIRST_PROGRESS_STEP_INDEX = SETUP_STEP_ORDER.indexOf(Routes.CASH_SETUP_IDENTITY);
const FINAL_PROGRESS_STEP_INDEX = SETUP_STEP_ORDER.indexOf(Routes.CASH_SETUP_ALL_DONE);
const PROGRESS_STEP_COUNT = FINAL_PROGRESS_STEP_INDEX - FIRST_PROGRESS_STEP_INDEX + 1;

export const SetupProgressIndicator = memo(function SetupProgressIndicator() {
  const blue = useForegroundColor('blue');
  const progress = useStoreSharedValue(useCashDepositSetupNavigationStore, s => getSetupProgress(s.activeRoute));

  const containerStyle = useAnimatedStyle(() => {
    const visible = progress.value > 0;
    return {
      opacity: withTiming(visible ? 1 : 0, TIMING_CONFIGS.buttonPressConfig),
      transform: [{ scale: withTiming(visible ? 1 : 1.02, TIMING_CONFIGS.buttonPressConfig) }],
    };
  });

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(progress.value * INDICATOR_WIDTH, SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  return (
    <Box
      as={Animated.View}
      background="fillSecondary"
      borderRadius={INDICATOR_HEIGHT / 2}
      height={INDICATOR_HEIGHT}
      pointerEvents="none"
      style={[styles.container, containerStyle]}
      width={INDICATOR_WIDTH}
    >
      <Animated.View style={[styles.progress, { backgroundColor: blue, shadowColor: blue }, progressStyle]} />
    </Box>
  );
});

function getSetupProgress(activeRoute: (typeof SETUP_STEP_ORDER)[number]): number {
  const activeStepIndex = SETUP_STEP_ORDER.indexOf(activeRoute);
  if (activeStepIndex < FIRST_PROGRESS_STEP_INDEX || activeStepIndex > FINAL_PROGRESS_STEP_INDEX) return 0;
  return (activeStepIndex - FIRST_PROGRESS_STEP_INDEX + 1) / PROGRESS_STEP_COUNT;
}

const styles = StyleSheet.create({
  container: {
    left: '50%',
    marginLeft: -INDICATOR_WIDTH / 2,
    marginTop: -INDICATOR_HEIGHT / 2,
    position: 'absolute',
    top: '50%',
  },
  progress: {
    borderCurve: 'continuous',
    borderRadius: INDICATOR_HEIGHT / 2,
    height: '100%',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});
