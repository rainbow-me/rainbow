import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { ClaimSteps, useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { IS_DEV } from '@/env';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: 24, delay: time.ms(200) });

export const NothingToClaimStep = memo(function NothingToClaimStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();

  return (
    <View style={styles.container}>
      {IS_DEV && (
        <ButtonPressAnimation
          style={{ position: 'absolute', top: 60, left: 20 }}
          onPress={() => {
            'worklet';
            setActiveStep(ClaimSteps.Introduction);
          }}
        >
          <Text color="white" size="15pt" weight="heavy">
            {'Restart'}
          </Text>
        </ButtonPressAnimation>
      )}
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Box gap={24}>
          <Animated.View entering={enteringAnimation}>
            <Box gap={20}>
              <Text color="label" size="34pt" weight="heavy" align="center">
                {'Earn Rewards'}
              </Text>
            </Box>
          </Animated.View>
          <Animated.View entering={enteringAnimation}>
            <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
              {'To earn $RNBW, swap, trade perps, and predict'}
            </Text>
          </Animated.View>
        </Box>
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  button: {
    height: 51,
    width: 250,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
