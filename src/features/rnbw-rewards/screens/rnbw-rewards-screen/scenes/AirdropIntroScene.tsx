import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Box, globalColors, Text } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import * as i18n from '@/languages';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import Animated, { runOnJS } from 'react-native-reanimated';
import { time } from '@/utils/time';
import {
  createScaleInFadeInSlideEnterAnimation,
  createScaleOutFadeOutSlideExitAnimation,
} from '@/features/rnbw-rewards/animations/sceneTransitions';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ delay: time.ms(200) });

const exitingAnimationFirstTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(20) });
const exitingAnimationSecondTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(120) });
const exitingAnimationThirdTranche = createScaleOutFadeOutSlideExitAnimation({ delay: time.ms(240) });

export const AirdropIntroScene = memo(function AirdropIntroScene() {
  const isReadOnlyWallet = useIsReadOnlyWallet();

  const handleCheckEligibility = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    rewardsFlowActions.startAirdropEligibilityCheck();
    rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropEligibility);
  }, [isReadOnlyWallet]);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation}>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Box gap={24}>
          <Animated.View exiting={exitingAnimationFirstTranche}>
            <Box gap={20}>
              <Text color="labelQuaternary" size="22pt" weight="heavy" align="center">
                {i18n.t(i18n.l.rnbw_rewards.introduction.introducing)}
              </Text>
              <Text color="label" size="34pt" weight="heavy" align="center">
                {i18n.t(i18n.l.rnbw_rewards.introduction.rainbow_token)}
              </Text>
            </Box>
          </Animated.View>
          <Animated.View exiting={exitingAnimationSecondTranche}>
            <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
              {i18n.t(i18n.l.rnbw_rewards.introduction.description_prefix)}
              <Text color="label" size="17pt / 150%" weight="bold">
                {'$RNBW.'}
              </Text>
              {i18n.t(i18n.l.rnbw_rewards.introduction.description_suffix)}
            </Text>
          </Animated.View>
        </Box>
        <Animated.View exiting={exitingAnimationThirdTranche}>
          <ButtonPressAnimation style={styles.button} onPress={handleCheckEligibility}>
            <Text color="black" size="22pt" weight="heavy">
              {i18n.t(i18n.l.rnbw_rewards.introduction.check_eligibility)}
            </Text>
          </ButtonPressAnimation>
        </Animated.View>
      </Box>
    </Animated.View>
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
    backgroundColor: globalColors.white100,
  },
});
