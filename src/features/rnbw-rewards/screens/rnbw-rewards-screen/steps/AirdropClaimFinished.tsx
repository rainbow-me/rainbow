import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Text } from '@/design-system';
import {
  ClaimSteps,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import * as i18n from '@/languages';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const AirdropClaimFinishedStep = memo(function AirdropClaimFinishedStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const { tokenAmount } = useRnbwAirdropStore(state => state.getFormattedBalance());

  useEffect(() => {
    // TODO: product question - should we do this automatically or have explicit button?
    setTimeout(() => {
      setActiveStep(ClaimSteps.Rewards);
    }, time.seconds(5));
  }, [setActiveStep]);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center">
        <Text color="label" size="30pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.airdrop_claimed)}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.you_claimed)}
          <Text color="label" size="17pt" weight="bold" align="center">
            {convertAmountToBalanceDisplayWorklet(tokenAmount, { decimals: 2, symbol: 'RNBW' })}
          </Text>
        </Text>
      </Box>
    </Animated.View>
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
