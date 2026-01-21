import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/design-system';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export type LoadingStepResult<T> = { status: 'success'; data: T } | { status: 'error'; error: unknown };

type LoadingStepProps<T> = {
  labels: string[];
  task: () => Promise<T>;
  onComplete?: (result: LoadingStepResult<T>) => void;
};

export function LoadingStep<T>({ labels: baseLabels, task, onComplete }: LoadingStepProps<T>) {
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const taskResultRef = useRef<LoadingStepResult<T> | null>(null);
  // Empty string as last label allows final real label to exit animate before unmount
  const labels = [...baseLabels, ''];

  // Run the task
  useEffect(() => {
    setCurrentLabelIndex(0);
    taskResultRef.current = null;

    task()
      .then(data => {
        taskResultRef.current = { status: 'success', data };
      })
      .catch(error => {
        taskResultRef.current = { status: 'error', error };
      });
  }, [task]);

  // Cycle through labels and fire completion when lables cycled + task is settled
  useEffect(() => {
    let didComplete = false;

    const interval = setInterval(() => {
      setCurrentLabelIndex(prev => {
        const next = prev + 1;
        if (next >= labels.length) {
          clearInterval(interval);
          if (taskResultRef.current && !didComplete) {
            didComplete = true;
            onComplete?.(taskResultRef.current);
          }
          return prev;
        }
        return next;
      });
    }, time.seconds(2));

    return () => clearInterval(interval);
  }, [labels.length, onComplete]);

  const currentLabel = labels[currentLabelIndex] ?? '';

  return (
    <View style={styles.container}>
      <Animated.View key={`${currentLabel}-${currentLabelIndex}`} entering={enteringAnimation} exiting={exitingAnimation}>
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
