import { memo, useCallback, useState } from 'react';
import { View, RefreshControl, Alert } from 'react-native';
import { Box, Text } from '@/design-system';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import { AirdropCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AirdropCard';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import { delay } from '@/utils/delay';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { time } from '@/utils/time';
import * as i18n from '@/languages';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import {
  ClaimSteps,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import Animated from 'react-native-reanimated';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';

const enterAnimation = createScaleInFadeInSlideEnterAnimation({ delay: time.ms(200) });

export const RnbwRewardsStep = function RnbwRewardsStep() {
  const { setActiveStep, scrollHandler } = useRnbwRewardsTransitionContext();
  const [refreshing, setRefreshing] = useState(false);
  const hasClaimedAirdrop = useRnbwAirdropStore(state => state.hasClaimed());
  const address = useWalletsStore(state => state.accountAddress);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([useRnbwRewardsStore.getState().fetch(undefined, { force: true }), delay(time.seconds(1))]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleClaimRewards = useCallback(async () => {
    setActiveStep(ClaimSteps.ClaimingRewards);
    try {
      // await claimRewards({ address: address, currency: nativeCurrency });
      await delay(5_000);
    } catch (e) {
      Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
    } finally {
      setActiveStep(ClaimSteps.Rewards);
    }
  }, [setActiveStep]);

  return (
    <Animated.View style={{ flex: 1 }} entering={enterAnimation} exiting={defaultExitAnimation}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <RnbwRewardsBalance onClaimRewards={handleClaimRewards} />
      </Animated.ScrollView>
      {!hasClaimedAirdrop && (
        <View style={{ paddingBottom: 32, paddingHorizontal: 20 }}>
          <AirdropCard />
        </View>
      )}
    </Animated.View>
  );
};

const RnbwRewardsBalance = memo(function RnbwRewardsBalance({ onClaimRewards }: { onClaimRewards: () => void }) {
  const { tokenAmount, nativeCurrencyAmount } = useRnbwRewardsStore(state => state.getBalance());

  return (
    <View style={{ paddingTop: getCoinBottomPosition(ClaimSteps.Rewards) + 20 }}>
      <Box gap={24}>
        <Box gap={16}>
          <Text size="44pt" weight="heavy" color="label" align="center" style={{ fontSize: 54, lineHeight: 60 }}>
            {nativeCurrencyAmount}
          </Text>
          <Text size="17pt" weight="bold" color="label" align="center">
            {convertAmountToBalanceDisplayWorklet(tokenAmount, { decimals: 2, symbol: 'RNBW' })}
          </Text>
        </Box>
        <HoldToActivateButton
          label="Claim Rewards"
          onLongPress={onClaimRewards}
          backgroundColor="white"
          disabledBackgroundColor="white"
          isProcessing={false}
          processingLabel="Claiming Rewards..."
          showBiometryIcon={true}
        />
      </Box>
    </View>
  );
});
