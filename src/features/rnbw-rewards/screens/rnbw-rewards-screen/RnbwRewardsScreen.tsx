import { memo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text } from '@/design-system';
import { Navbar } from '@/components/navbar/Navbar';
import { AccountImage } from '@/components/AccountImage';
import { RnbwAirdropScene } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/RnbwAirdropScene';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { AirdropCard } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/AirdropCard';
import { useAirdropStore } from '@/features/rnbw-rewards/stores/airdropStore';
import { RnbwRewardsContextProvider, useRnbwRewardsContext } from '@/features/rnbw-rewards/context/RnbwRewardsContext';
import { convertAmountToBalanceDisplayWorklet } from '@/helpers/utilities';
import { delay } from '@/utils/delay';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { claimRewards } from '@/features/rnbw-rewards/utils/claimRewards';
import { time } from '@/utils/time';
import * as i18n from '@/languages';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/BottomGradientGlow';
import { getCoinBottomPosition, RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/FloatingCoins';
import { LoadingStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/CheckingAirdropStep';
import {
  ClaimSteps,
  RnbwRewardsTransitionContextProvider,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  return (
    <RnbwRewardsContextProvider>
      <RnbwRewardsTransitionContextProvider initialStep={ClaimSteps.Rewards}>
        <View style={styles.container}>
          <View style={[StyleSheet.absoluteFill, { top: safeAreaInsets.top }]}>
            <BottomGradientGlow />
            <RnbwCoin />
            <FloatingCoins />
          </View>
          <RnbwRewardsContent />
        </View>
      </RnbwRewardsTransitionContextProvider>
    </RnbwRewardsContextProvider>
  );
});

function RnbwRewardsContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const tabBarOffset = useTabBarOffset();
  const { showAirdropFlow } = useRnbwRewardsContext();
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const hasClaimedAirdrop = useAirdropStore(state => state.hasClaimed());
  const [refreshing, setRefreshing] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
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
    setIsClaimingRewards(true);
    setActiveStep(ClaimSteps.ClaimingRewards);
    try {
      // await claimRewards({ address: address, currency: nativeCurrency });
      await delay(5_000);
    } catch (e) {
      Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
    } finally {
      setIsClaimingRewards(false);
      setActiveStep(ClaimSteps.Rewards);
    }
  }, [address, nativeCurrency, setActiveStep]);

  return (
    <View style={[styles.rewardsContainer, { paddingTop: safeAreaInsets.top }]}>
      <Navbar leftComponent={<AccountImage />} floating />
      {showAirdropFlow && <RnbwAirdropScene />}
      {!showAirdropFlow && (
        <>
          {isClaimingRewards && <LoadingStep labels={['Claiming Rewards...']} onComplete={() => setIsClaimingRewards(false)} />}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <RnbwRewardsBalance onClaimRewards={handleClaimRewards} />
          </ScrollView>
          {!hasClaimedAirdrop && (
            <View style={{ paddingBottom: tabBarOffset + 32, paddingHorizontal: 20 }}>
              <AirdropCard />
            </View>
          )}
        </>
      )}
    </View>
  );
}
type RnbwRewardsBalanceProps = {
  onClaimRewards: () => void;
};

function RnbwRewardsBalance({ onClaimRewards }: RnbwRewardsBalanceProps) {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  rewardsContainer: {
    flex: 1,
  },
});
