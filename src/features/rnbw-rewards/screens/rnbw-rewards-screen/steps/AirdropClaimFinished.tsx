import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Text } from '@/design-system';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const AirdropClaimFinishedStep = memo(function AirdropClaimFinishedStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const { tokenAmount } = useRnbwAirdropStore(state => state.getFormattedAirdroppedBalance());

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
      <ButtonPressAnimation onPress={() => setActiveStep(ClaimSteps.Rewards)} scaleTo={0.96} style={styles.button}>
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
    top: getCoinBottomPosition(ClaimSteps.CheckingAirdrop) + 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingHorizontal: 42,
  },
});
