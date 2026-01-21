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
import * as i18n from '@/languages';

const EXIT_ANIMATION_DURATION = time.ms(500);
const LABEL_CYCLE_INTERVAL = time.seconds(2);
const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export type LoadingStepResult<T> = { status: 'success'; data: T } | { status: 'error'; error: unknown };

type LoadingStepProps<T> = {
  labels: string[];
  task: () => Promise<T>;
  onComplete?: (result: LoadingStepResult<T>) => void;
};

type DisplayState = { type: 'label'; index: number } | { type: 'fallback' } | { type: 'exiting' };

export function LoadingStep<T>({ labels, task, onComplete }: LoadingStepProps<T>) {
  const fallbackLabel = i18n.t(i18n.l.rnbw_rewards.claim.please_be_patient);
  const [displayState, setDisplayState] = useState<DisplayState>({ type: 'label', index: 0 });
  const taskResultRef = useRef<LoadingStepResult<T> | null>(null);

  // Run the task
  useEffect(() => {
    setDisplayState({ type: 'label', index: 0 });
    taskResultRef.current = null;

    task()
      .then(data => {
        taskResultRef.current = { status: 'success', data };
        setDisplayState(prev => (prev.type === 'fallback' ? { type: 'exiting' } : prev));
      })
      .catch(error => {
        taskResultRef.current = { status: 'error', error };
        setDisplayState(prev => (prev.type === 'fallback' ? { type: 'exiting' } : prev));
      });
  }, [task]);

  // Cycle through labels
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayState(prev => {
        if (prev.type !== 'label') {
          clearInterval(interval);
          return prev;
        }

        const next = prev.index + 1;
        if (next >= labels.length) {
          clearInterval(interval);
          if (taskResultRef.current) {
            return { type: 'exiting' };
          } else {
            return { type: 'fallback' };
          }
        }
        return { type: 'label', index: next };
      });
    }, LABEL_CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [labels.length]);

  useEffect(() => {
    if (displayState.type !== 'exiting') return;

    const timeout = setTimeout(() => {
      if (taskResultRef.current) {
        onComplete?.(taskResultRef.current);
      }
    }, EXIT_ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [displayState.type, onComplete]);

  const currentLabel =
    displayState.type === 'label' ? labels[displayState.index] ?? '' : displayState.type === 'fallback' ? fallbackLabel : '';

  const animationKey =
    displayState.type === 'label' ? `label-${displayState.index}` : displayState.type === 'fallback' ? 'fallback' : 'exiting';

  return (
    <View style={styles.container}>
      <Animated.View key={animationKey} entering={enteringAnimation} exiting={exitingAnimation}>
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
