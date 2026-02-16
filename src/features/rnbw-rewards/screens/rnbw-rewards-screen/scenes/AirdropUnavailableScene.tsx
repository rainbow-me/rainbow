import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Text } from '@/design-system';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { createScaleInFadeInSlideEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import * as i18n from '@/languages';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { opacity } from '@/framework/ui/utils/opacity';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = defaultExitAnimation;

export const AirdropUnavailableScene = memo(function AirdropUnavailableScene() {
  const wasEverAirdropped = useAirdropBalanceStore(state => state.wasEverAirdropped());

  const title = wasEverAirdropped ? i18n.t(i18n.l.rnbw_rewards.airdrop.already_claimed) : i18n.t(i18n.l.rnbw_rewards.airdrop.no_airdrop);

  const description = wasEverAirdropped
    ? i18n.t(i18n.l.rnbw_rewards.airdrop.already_claimed_description)
    : i18n.t(i18n.l.rnbw_rewards.airdrop.no_airdrop_description);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center" style={styles.claimInfoContainer}>
        <Text color="label" size="30pt" weight="heavy" align="center">
          {title}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {description}
        </Text>
      </Box>
      <ButtonPressAnimation
        onPress={() => rewardsFlowActions.setActiveScene(RnbwRewardsScenes.RewardsOverview)}
        scaleTo={0.96}
        style={styles.button}
      >
        <Box
          backgroundColor={opacity('#F5F8FF', 0.06)}
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
