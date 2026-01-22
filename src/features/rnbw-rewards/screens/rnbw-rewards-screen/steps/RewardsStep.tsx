import { memo, useCallback, useState } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import { AirdropCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AirdropCard';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import {
  ClaimSteps,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import Animated, { runOnJS } from 'react-native-reanimated';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { HowToEarnCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/HowToEarnCard';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import * as i18n from '@/languages';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';

const enterAnimation = createScaleInFadeInSlideEnterAnimation({ delay: time.ms(200) });

export const RnbwRewardsStep = function RnbwRewardsStep() {
  const { scrollHandler } = useRnbwRewardsTransitionContext();
  const [refreshing, setRefreshing] = useState(false);
  const hasClaimedAirdrop = useRnbwAirdropStore(state => state.hasClaimed());
  // TESTING
  // const hasClaimedAirdrop = false;
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([useRnbwRewardsStore.getState().fetch(undefined, { force: true }), delay(time.seconds(1))]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <Animated.View style={styles.flex} entering={enterAnimation} exiting={defaultExitAnimation}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        contentContainerStyle={styles.scrollViewContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <RnbwRewardsBalance />
      </Animated.ScrollView>
      {hasClaimedAirdrop ? (
        <View style={styles.cardContainer}>
          <HowToEarnCard />
        </View>
      ) : (
        <View style={styles.cardContainer}>
          <AirdropCard />
        </View>
      )}
    </Animated.View>
  );
};

const RnbwRewardsBalance = memo(function RnbwRewardsBalance() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const { tokenAmount, nativeCurrencyAmount } = useRnbwRewardsStore(state => state.getFormattedBalance());
  const hasClaimableRewards = useRnbwRewardsStore(state => state.hasClaimableRewards());

  const handleClaimRewards = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    setActiveStep(ClaimSteps.ClaimingRewards);
  }, [isReadOnlyWallet, setActiveStep]);

  return (
    <View style={styles.rewardsBalanceContainer}>
      <Box gap={24} alignItems="center">
        <Box gap={16}>
          <Text
            size="44pt"
            weight="heavy"
            color={hasClaimableRewards ? 'label' : 'labelSecondary'}
            align="center"
            style={{ fontSize: 54, lineHeight: 60 }}
          >
            {nativeCurrencyAmount}
          </Text>
          <Text size="17pt" weight="bold" color={hasClaimableRewards ? 'label' : 'labelSecondary'} align="center">
            {`${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Box>
        {hasClaimableRewards ? (
          <HoldToActivateButton
            label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
            onLongPress={handleClaimRewards}
            backgroundColor="white"
            disabledBackgroundColor="white"
            progressColor="black"
            isProcessing={false}
            processingLabel={i18n.t(i18n.l.rnbw_rewards.rewards.claiming_rewards)}
            showBiometryIcon={true}
            style={{ width: 251 }}
          />
        ) : (
          <Box paddingHorizontal={'16px'} gap={20}>
            <View style={{ height: 1, width: '100%', backgroundColor: opacityWorklet('#F5F8FF', 0.0625) }} />
            <Text size="15pt / 135%" weight="semibold" color="labelTertiary" align="center">
              {i18n.t(i18n.l.rnbw_rewards.rewards.empty_rewards_description)}
            </Text>
          </Box>
        )}
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  rewardsBalanceContainer: {
    paddingTop: getCoinBottomPosition(ClaimSteps.Rewards) + 20,
  },
  cardContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  scrollViewContainer: {
    paddingHorizontal: 20,
  },
});
