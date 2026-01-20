import { memo, useEffect, useRef, useState } from 'react';
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

type LoadingStep = {
  labels: string[];
  onComplete?: () => void;
};

export const LoadingStep = memo(function LoadingStep({ labels, onComplete }: LoadingStep) {
  const [progressLabelIndex, setProgressLabelIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const effectiveLabels = [...labels, ''];
  const labelCount = effectiveLabels.length;

  useEffect(() => {
    setProgressLabelIndex(0);
  }, [labels]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgressLabelIndex(prev => {
        if (prev < labelCount - 1) {
          return prev + 1;
        }
        return 0;
      });
    }, time.seconds(2));
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [labelCount]);

  useEffect(() => {
    if (progressLabelIndex === labelCount - 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onComplete?.();
      }, time.seconds(1));
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [labelCount, onComplete, progressLabelIndex]);

  return (
    <View style={styles.container}>
      {effectiveLabels.map((label, index) => {
        if (index === progressLabelIndex) {
          return (
            <Animated.View key={`${label}-${index}`} entering={enteringAnimation} exiting={exitingAnimation}>
              <Text color={{ custom: '#858585' }} size="20pt" weight="heavy">
                {label}
              </Text>
            </Animated.View>
          );
        }
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: getCoinBottomPosition(ClaimSteps.CheckingAirdrop) + 32,
    width: '100%',
    alignItems: 'center',
  },
});
