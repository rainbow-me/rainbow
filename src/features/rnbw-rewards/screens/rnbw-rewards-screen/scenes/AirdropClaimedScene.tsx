import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { createScaleInFadeInSlideEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import * as i18n from '@/languages';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { opacity } from '@/framework/ui/utils/opacity';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = defaultExitAnimation;

export const AirdropClaimedScene = memo(function AirdropClaimedScene() {
  const { tokenAmount } = useAirdropBalanceStore(state => state.getFormattedAirdroppedBalance());

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center" style={styles.claimInfoContainer}>
        <Text color="label" size="30pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.airdrop_claimed)}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.you_claimed)}
          <Text color="label" size="17pt" weight="bold" align="center">
            {` ${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
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
