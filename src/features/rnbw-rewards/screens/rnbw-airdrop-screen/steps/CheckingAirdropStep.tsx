import { memo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/design-system';
import { ClaimSteps, useRnbwAirdropContext } from '@/features/rnbw-rewards/context/RnbwAirdropContext';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const CheckingAirdropStep = memo(function CheckingAirdropStep() {
  const { setActiveStep } = useRnbwAirdropContext();

  const progressLabels = ['Calculating Rewards...', 'Checking Historical Activity...', 'Checking Eligibility...', ''];
  const [progressLabelIndex, setProgressLabelIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgressLabelIndex(prev => {
        if (prev < progressLabels.length - 1) {
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
  }, [progressLabels.length]);

  useEffect(() => {
    if (progressLabelIndex === progressLabels.length - 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setTimeout(() => {
        setActiveStep(ClaimSteps.Claim);
      }, time.seconds(1));
    }
  }, [progressLabelIndex, setActiveStep, progressLabels.length]);

  return (
    <View style={styles.container}>
      {progressLabels.map((label, index) => {
        if (index === progressLabelIndex) {
          return (
            <Animated.View key={label} entering={enteringAnimation} exiting={exitingAnimation}>
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
