import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { createScaleInFadeInSlideEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { rewardsFlowActions, useRewardsFlowStore } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import * as i18n from '@/languages';
import { convertRawAmountToDecimalFormat, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { time } from '@/utils/time';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = defaultExitAnimation;
const AUTO_ADVANCE_DELAY = time.seconds(2);

export const RewardsClaimedScene = memo(function RewardsClaimedScene() {
  const rewardsClaimRequest = useRewardsFlowStore(state => state.rewardsClaimRequest);
  const { tokenAmount } = useMemo(() => {
    // This scene rendering with this task result should never happen, but checking satisfies the types
    if (rewardsClaimRequest.status !== 'success' || !rewardsClaimRequest.data) {
      return { tokenAmount: '0' };
    }

    const rawTokenAmount = rewardsClaimRequest.data.claimedRnbw;
    const decimals = rewardsClaimRequest.data.decimals;
    const tokenAmountDecimal = convertRawAmountToDecimalFormat(rawTokenAmount, decimals);
    const formattedTokenAmount = truncateToDecimalsWithThreshold({ value: tokenAmountDecimal, decimals: 1, threshold: '0.01' });
    const isZero = rawTokenAmount === '0';

    return { tokenAmount: isZero ? '0' : formattedTokenAmount };
  }, [rewardsClaimRequest]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.RewardsOverview);
    }, AUTO_ADVANCE_DELAY);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box gap={24} alignItems="center" style={styles.claimInfoContainer}>
        <Text color="label" size="30pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_rewards.rewards_claim_finished.rewards_claimed)}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.rewards_claim_finished.you_claimed)}
          <Text color="label" size="17pt" weight="bold" align="center">
            {` ${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Text>
      </Box>
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
    top: getCoinBottomPosition(RnbwRewardsScenes.RewardsClaimed) + 20,
    width: '100%',
    alignItems: 'center',
  },
});
