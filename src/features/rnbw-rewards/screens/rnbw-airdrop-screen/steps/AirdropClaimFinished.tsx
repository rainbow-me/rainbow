import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box, Text } from '@/design-system';
import { ClaimSteps } from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';
import { useRnbwRewardsContext } from '@/features/rnbw-rewards/context/RnbwRewardsContext';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const AirdropClaimFinishedStep = memo(function AirdropClaimFinishedStep() {
  const { setShowAirdropFlow } = useRnbwRewardsContext();
  // TODO: testing values
  const amountClaimed = 534.25;

  useEffect(() => {
    setTimeout(() => {
      setShowAirdropFlow(false);
    }, time.seconds(5));
  }, [setShowAirdropFlow]);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center">
        <Text color="label" size="30pt" weight="heavy" align="center">
          {'Airdrop Claimed'}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="bold" align="center">
          {`You claimed ${amountClaimed} RNBW`}
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
