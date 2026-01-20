import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, useColorMode } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { ClaimSteps, useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { createScaleOutFadeOutSlideExitAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';

const customExitingFirstTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(20) });
const customExitingSecondTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(120) });
const customExitingThirdTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(240) });

export const IntroductionStep = memo(function IntroductionStep() {
  const { isDarkMode } = useColorMode();
  const { setActiveStep } = useRnbwRewardsTransitionContext();

  return (
    <View style={styles.container}>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Box gap={24}>
          <Animated.View exiting={customExitingFirstTranche}>
            <Box gap={20}>
              <Text color="labelQuaternary" size="22pt" weight="heavy" align="center">
                {i18n.t(i18n.l.rnbw_rewards.introduction.introducing)}
              </Text>
              <Text color="label" size="34pt" weight="heavy" align="center">
                {i18n.t(i18n.l.rnbw_rewards.introduction.rainbow_token)}
              </Text>
            </Box>
          </Animated.View>
          <Animated.View exiting={customExitingSecondTranche}>
            <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
              {i18n.t(i18n.l.rnbw_rewards.introduction.description)}
            </Text>
          </Animated.View>
        </Box>
        <Animated.View exiting={customExitingThirdTranche}>
          <ButtonPressAnimation
            style={[styles.button, { backgroundColor: isDarkMode ? globalColors.white100 : globalColors.grey100 }]}
            onPress={() => {
              'worklet';
              setActiveStep(ClaimSteps.CheckingAirdrop);
            }}
          >
            <Text color="black" size="22pt" weight="heavy">
              {i18n.t(i18n.l.rnbw_rewards.introduction.check_eligibility)}
            </Text>
          </ButtonPressAnimation>
        </Animated.View>
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
