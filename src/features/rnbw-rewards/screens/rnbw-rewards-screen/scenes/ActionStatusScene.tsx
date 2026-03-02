import { useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import { Text } from '@/design-system';
import { type AsyncActionState } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/sceneTransitions';
import * as i18n from '@/languages';

const EXIT_ANIMATION_DURATION = time.ms(500);
const LABEL_CYCLE_INTERVAL = time.seconds(2);
const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();
const EMPTY_LABEL = ' ';

type ActionStatusSceneProps<T> = {
  labels: string[];
  task: AsyncActionState<T>;
  onComplete?: (taskStatus: 'success' | 'error') => void;
};

export function ActionStatusScene<T>({ labels, task, onComplete }: ActionStatusSceneProps<T>) {
  const fallbackLabel = labels[labels.length - 1];
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
  }, [labelIndex, allLabelsDisplayedAndTaskCompleted, onComplete, task.status, labels.length]);

  const currentLabel = isExiting ? EMPTY_LABEL : labels[labelIndex] ?? fallbackLabel;

  return (
    <Animated.View key={currentLabel} entering={enteringAnimation} exiting={exitingAnimation}>
      <Text color={{ custom: '#858585' }} size="20pt" weight="heavy">
        {currentLabel}
      </Text>
    </Animated.View>
  );
}
