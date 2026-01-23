import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Text } from '@/design-system';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const AirdropUnavailableScene = memo(function AirdropUnavailableScene() {
  const { setActiveScene } = useRnbwRewardsFlowContext();

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center" style={styles.claimInfoContainer}>
        <Text color="label" size="30pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop.nothing_to_claim)}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop.nothing_to_claim_description)}
        </Text>
      </Box>
      <ButtonPressAnimation onPress={() => setActiveScene(RnbwRewardsScenes.RewardsOverview)} scaleTo={0.96} style={styles.button}>
        <Box
          backgroundColor={opacityWorklet('#F5F8FF', 0.06)}
          width="full"
          height={52}
          borderRadius={26}
          justifyContent="center"
          alignItems="center"
          borderColor={'separatorTertiary'}
          borderWidth={1}
        >
          <Text color="label" size="22pt" weight="heavy" align="center">
            {i18n.t(i18n.l.button.continue)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  claimInfoContainer: {
    position: 'absolute',
    top: getCoinBottomPosition(RnbwRewardsScenes.AirdropEligibility) + 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingHorizontal: 42,
  },
});
