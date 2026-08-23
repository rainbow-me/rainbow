import { memo } from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, useForegroundColor } from '@/design-system';
import Routes from '@/navigation/routesNames';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { useSetupContext } from '../setupContext';
import { SETUP_STEP_ORDER } from '../steps';

const INDICATOR_HEIGHT = 8;
const INDICATOR_WIDTH = 96;

const FIRST_PROGRESS_STEP_INDEX = SETUP_STEP_ORDER.indexOf(Routes.CASH_SETUP_IDENTITY);
const FINAL_PROGRESS_STEP_INDEX = SETUP_STEP_ORDER.indexOf(Routes.CASH_SETUP_ALL_DONE);
const PROGRESS_STEP_COUNT = FINAL_PROGRESS_STEP_INDEX - FIRST_PROGRESS_STEP_INDEX + 1;

function getSetupProgress(activeRoute: (typeof SETUP_STEP_ORDER)[number]): number {
  'worklet';
  const activeStepIndex = SETUP_STEP_ORDER.indexOf(activeRoute);
  if (activeStepIndex < FIRST_PROGRESS_STEP_INDEX || activeStepIndex > FINAL_PROGRESS_STEP_INDEX) return 0;
  return (activeStepIndex - FIRST_PROGRESS_STEP_INDEX + 1) / PROGRESS_STEP_COUNT;
}

export const SetupProgressIndicator = memo(function SetupProgressIndicator() {
  const { handleProgressSettled } = useSetupContext();
  const blue = useForegroundColor('blue');
  const green = useForegroundColor('green');

  const activeRoute = useStoreSharedValue(useCashDepositSetupNavigationStore, s => s.activeRoute);
  const animatedProgress = useSharedValue(0);
  const exitProgress = useSharedValue(0);
  const fillColor = useSharedValue(blue);

  const progress = useDerivedValue(() => getSetupProgress(activeRoute.value));
  const showProgressBar = useDerivedValue(() => progress.value > 0 && exitProgress.value < 1);

  const containerStyle = useAnimatedStyle(() => {
    const show = showProgressBar.value;
    return {
      opacity: withTiming(show ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      transform: [{ scale: withTiming(show ? 1 : 0.925, TIMING_CONFIGS.slowFadeConfig) }],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    const backgroundColor = fillColor.value;
    return {
      backgroundColor,
      shadowColor: backgroundColor,
      width: animatedProgress.value * INDICATOR_WIDTH,
    };
  });

  useAnimatedReaction(
    () => activeRoute.value,
    route => {
      const destination = getSetupProgress(route);
      if (animatedProgress.value === destination) {
        runOnJS(handleProgressSettled)(route);
        return;
      }

      animatedProgress.value = withTiming(destination, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
        if (isFinished && activeRoute.value === route) runOnJS(handleProgressSettled)(route);
      });
    },
    [handleProgressSettled]
  );

  useAnimatedReaction(
    () => blue,
    (current, previous) => {
      if (previous === null) return;
      const isBarStillBlue = progress.value < 1 && exitProgress.value === 0;
      if (isBarStillBlue) fillColor.value = current;
    },
    [blue]
  );

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (previous === null) return;

      const didCompleteSetup = current === 1 && previous < 1 && exitProgress.value === 0;
      if (!didCompleteSetup) return;

      fillColor.value = withTiming(green, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
        if (isFinished) exitProgress.value = withTiming(1, TIMING_CONFIGS.slowestFadeConfig);
      });
      triggerHaptics('notificationSuccess');
    },
    [green]
  );

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
      <Animated.View style={[styles.progressBar, { backgroundColor: blue }, progressBarStyle]} />
    </Box>
  );
});

const styles = StyleSheet.create({
  container: {
    left: '50%',
    marginLeft: -INDICATOR_WIDTH / 2,
    marginTop: -INDICATOR_HEIGHT / 2,
    overflow: 'visible',
    position: 'absolute',
    top: '50%',
  },
  progressBar: {
    borderCurve: 'continuous',
    borderRadius: INDICATOR_HEIGHT / 2,
    height: '100%',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
  },
});
