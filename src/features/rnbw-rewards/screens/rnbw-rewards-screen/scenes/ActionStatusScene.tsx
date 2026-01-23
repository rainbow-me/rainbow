import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/design-system';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { AsyncActionState } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import * as i18n from '@/languages';

const EXIT_ANIMATION_DURATION = time.ms(500);
const LABEL_CYCLE_INTERVAL = time.seconds(2);
const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

type ActionStatusSceneProps<T> = {
  labels: string[];
  task: AsyncActionState<T>;
  onComplete?: (taskStatus: 'success' | 'error') => void;
};

export function ActionStatusScene<T>({ labels, task, onComplete }: ActionStatusSceneProps<T>) {
  const fallbackLabel = i18n.t(i18n.l.rnbw_rewards.claim.please_be_patient);
  const [labelIndex, setLabelIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const allLabelsDisplayed = labelIndex >= labels.length - 1;
  const isTaskCompleted = task.status === 'success' || task.status === 'error';
  const allLabelsDisplayedAndTaskCompleted = allLabelsDisplayed && isTaskCompleted;

  useEffect(() => {
    const interval = setInterval(() => {
      if (allLabelsDisplayedAndTaskCompleted) {
        setIsExiting(true);
        setTimeout(() => {
          onComplete?.(task.status);
        }, EXIT_ANIMATION_DURATION);
        return;
      }
      setLabelIndex(prev => prev + 1);
    }, LABEL_CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [labelIndex, allLabelsDisplayedAndTaskCompleted, onComplete, task.status]);

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
    top: getCoinBottomPosition(RnbwRewardsScenes.AirdropEligibility) + 32,
    width: '100%',
    alignItems: 'center',
  },
});
