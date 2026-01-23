import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/design-system';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { TaskState } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsFlowStore';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import * as i18n from '@/languages';

const EXIT_ANIMATION_DURATION = time.ms(500);
const LABEL_CYCLE_INTERVAL = time.seconds(2);
const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

type LoadingStepProps<T> = {
  labels: string[];
  task?: TaskState<T> | null;
  onComplete?: (taskStatus: 'success' | 'error') => void;
};

export function LoadingStep<T>({ labels, task, onComplete }: LoadingStepProps<T>) {
  const fallbackLabel = i18n.t(i18n.l.rnbw_rewards.claim.please_be_patient);
  const [labelIndex, setLabelIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const isTaskCompleted = task?.status === 'success' || task?.status === 'error';

  useEffect(() => {
    const interval = setInterval(() => {
      // Not labels.length - 1 to allow for the fallback label
      const labelsDone = labelIndex === labels.length;
      if (labelsDone || isExiting) return;
      setLabelIndex(prev => prev + 1);
    }, LABEL_CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [isExiting, labelIndex, labels.length]);

  useEffect(() => {
    if (isExiting || !isTaskCompleted) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.(task.status);
    }, EXIT_ANIMATION_DURATION);
  }, [isExiting, onComplete, isTaskCompleted, task?.status]);

  const currentLabel = isExiting ? '' : labels[labelIndex] ?? fallbackLabel;

  return (
    <View style={styles.container}>
      <Animated.View key={currentLabel} entering={enteringAnimation} exiting={exitingAnimation}>
        <Text color={{ custom: '#858585' }} size="20pt" weight="heavy">
          {currentLabel}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: getCoinBottomPosition(ClaimSteps.CheckingAirdrop) + 32,
    width: '100%',
    alignItems: 'center',
  },
});
