import { memo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navbar } from '@/components/navbar/Navbar';
import { AccountImage } from '@/components/AccountImage';
import { Box, Text } from '@/design-system';
import { RnbwAirdropScreen } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/RnbwAirdropScreen';
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

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <RnbwRewardsContextProvider>
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <RnbwRewardsContent />
      </View>
    </RnbwRewardsContextProvider>
  );
});

function RnbwRewardsContent() {
  const { showAirdropFlow } = useRnbwRewardsContext();
  const hasClaimedAirdrop = useAirdropStore(state => state.getData()?.hasClaimed ?? false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([useRnbwRewardsStore.getState().fetch(undefined, { force: true }), delay(time.seconds(1))]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (showAirdropFlow) {
    return <RnbwAirdropScreen />;
  }

  return (
    <View style={styles.container}>
      <Navbar leftComponent={<AccountImage />} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <RnbwRewardsBalance />
        {!hasClaimedAirdrop && <AirdropCard />}
      </ScrollView>
    </View>
  );
}
function RnbwRewardsBalance() {
  const { tokenAmount, nativeCurrencyAmount } = useRnbwRewardsStore(state => state.getBalance());
  const address = useWalletsStore(state => state.accountAddress);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const handleClaimRewards = useCallback(async () => {
    await claimRewards({ address: address, currency: nativeCurrency });
  }, [address, nativeCurrency]);

  return (
    <Box gap={12}>
      <Box justifyContent="center" alignItems="center" background="surfaceSecondaryElevated" borderRadius={16} padding="20px" gap={12}>
        <Box flexDirection="row" alignItems="flex-end" gap={4}>
          <Text size="26pt" weight="black" color="label">
            {convertAmountToBalanceDisplayWorklet(tokenAmount, { decimals: 2, symbol: 'RNBW' })}
          </Text>
        </Box>
        <Text size="20pt" weight="black" color="label">
          {nativeCurrencyAmount}
        </Text>
      </Box>
      <ButtonPressAnimation onPress={handleClaimRewards} scaleTo={0.96}>
        <Box background="white" borderRadius={16} padding="20px" gap={12} alignItems="center">
          <Text size="22pt" weight="heavy" color="label">
            Claim Rewards
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
