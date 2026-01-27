import { memo, useCallback, useState } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { AirdropSummaryCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AirdropSummaryCard';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import Animated, { runOnJS } from 'react-native-reanimated';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { RewardsHowToEarnCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RewardsHowToEarnCard';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import * as i18n from '@/languages';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';
import { rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';

const enterAnimation = createScaleInFadeInSlideEnterAnimation({ delay: time.ms(200) });

export const RewardsOverviewScene = function RewardsOverviewScene() {
  const { scrollHandler } = useRnbwRewardsFlowContext();
  const [refreshing, setRefreshing] = useState(false);
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([useRewardsBalanceStore.getState().fetch(undefined, { force: true }), delay(time.seconds(1))]);
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
      {hasClaimableAirdrop ? (
        <View style={styles.cardContainer}>
          <AirdropSummaryCard />
        </View>
      ) : (
        <View style={styles.cardContainer}>
          <RewardsHowToEarnCard />
        </View>
      )}
    </Animated.View>
  );
};

const RnbwRewardsBalance = memo(function RnbwRewardsBalance() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const { tokenAmount, nativeCurrencyAmount } = useRewardsBalanceStore(state => state.getFormattedBalance());
  const hasClaimableRewards = useRewardsBalanceStore(state => state.hasClaimableRewards());

  const handleClaimRewards = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    rewardsFlowActions.startRewardsClaim();
    setActiveScene(RnbwRewardsScenes.RewardsClaiming);
  }, [isReadOnlyWallet, setActiveScene]);

  return (
    <View style={styles.rewardsBalanceContainer}>
      <Box gap={24} alignItems="center">
        <Box gap={16}>
          <Text size="54pt" weight="heavy" color={hasClaimableRewards ? 'label' : 'labelSecondary'} align="center">
            {nativeCurrencyAmount}
          </Text>
          <Text size="17pt" weight="bold" color={hasClaimableRewards ? 'label' : 'labelSecondary'} align="center">
            {`${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Box>
        {hasClaimableRewards ? (
          <Box gap={16} alignItems="center" style={{ width: 251 }}>
            <HoldToActivateButton
              label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
              onLongPress={handleClaimRewards}
              backgroundColor="white"
              disabledBackgroundColor="white"
              progressColor="black"
              isProcessing={false}
              processingLabel={i18n.t(i18n.l.rnbw_rewards.rewards.claiming_rewards)}
              showBiometryIcon={true}
              style={{ width: '100%' }}
            />
            <Text size="15pt / 135%" weight="semibold" color={{ custom: opacityWorklet('#F5F8FF', 0.56) }} align="center">
              {i18n.t(i18n.l.rnbw_rewards.rewards.claim_rewards_description)}
            </Text>
          </Box>
        ) : (
          <Box paddingHorizontal={'16px'} gap={20} width={'full'}>
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
    paddingTop: getCoinBottomPosition(RnbwRewardsScenes.RewardsOverview) + 20,
  },
  cardContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  scrollViewContainer: {
    paddingHorizontal: 20,
  },
});
