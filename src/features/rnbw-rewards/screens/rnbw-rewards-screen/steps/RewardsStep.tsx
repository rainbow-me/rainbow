import { memo, useCallback, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { Box, Text } from '@/design-system';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import { AirdropCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AirdropCard';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import {
  ClaimSteps,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import Animated from 'react-native-reanimated';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { HowToEarnCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/HowToEarnCard';

const enterAnimation = createScaleInFadeInSlideEnterAnimation({ delay: time.ms(200) });

export const RnbwRewardsStep = function RnbwRewardsStep() {
  const { setActiveStep, scrollHandler } = useRnbwRewardsTransitionContext();
  const [refreshing, setRefreshing] = useState(false);
  const hasClaimedAirdrop = useRnbwAirdropStore(state => state.hasClaimed());
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([useRnbwRewardsStore.getState().fetch(undefined, { force: true }), delay(time.seconds(1))]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleClaimRewards = useCallback(() => {
    setActiveStep(ClaimSteps.ClaimingRewards);
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
      {hasClaimedAirdrop ? (
        <View style={{ paddingBottom: 32, paddingHorizontal: 20 }}>
          <HowToEarnCard />
        </View>
      ) : (
        <View style={{ paddingBottom: 32, paddingHorizontal: 20 }}>
          <AirdropCard />
        </View>
      )}
    </Animated.View>
  );
};

const RnbwRewardsBalance = memo(function RnbwRewardsBalance({ onClaimRewards }: { onClaimRewards: () => void }) {
  const { tokenAmount, nativeCurrencyAmount } = useRnbwRewardsStore(state => state.getFormattedBalance());
  const hasClaimableRewards = useRnbwRewardsStore(state => state.hasClaimableRewards());

  return (
    <View style={{ paddingTop: getCoinBottomPosition(ClaimSteps.Rewards) + 20 }}>
      <Box gap={24}>
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
            {`${tokenAmount} RNBW`}
          </Text>
        </Box>
        {hasClaimableRewards ? (
          <HoldToActivateButton
            label="Claim Rewards"
            onLongPress={onClaimRewards}
            backgroundColor="white"
            disabledBackgroundColor="white"
            isProcessing={false}
            processingLabel="Claiming Rewards..."
            showBiometryIcon={true}
          />
        ) : (
          <Box paddingHorizontal={'16px'} gap={20}>
            <View style={{ height: 1, width: '100%', backgroundColor: opacityWorklet('#F5F8FF', 0.0625) }} />
            <Text size="15pt / 135%" weight="semibold" color="labelTertiary" align="center">
              {'You Can Earn $RNBW by Swapping Tokens. Other Ways to Earn Coming Soon.'}
            </Text>
          </Box>
        )}
      </Box>
    </View>
  );
});
