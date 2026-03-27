import { memo, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { Box, useColorMode } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { RnbwRewardsClaimCard } from './components/RnbwRewardsClaimCard';
import { RnbwAirdropClaimCard } from './components/RnbwAirdropClaimCard';
import { RnbwStakingCard } from './components/RnbwStakingCard';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const { isDarkMode } = useColorMode();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    await Promise.allSettled([
      Promise.allSettled([
        useRewardsBalanceStore.getState().fetch(undefined, { force: true }),
        useAirdropBalanceStore.getState().fetch(undefined, { force: true }),
        useStakingPositionStore.getState().fetch(undefined, { force: true }),
      ]),
      delay(time.seconds(1)),
    ]);
    setIsRefreshing(false);
  }, []);

  return (
    <Box backgroundColor={isDarkMode ? '#090909' : '#FFFFFF'} style={styles.flex}>
      <Navbar hasStatusBarInset title="Membership" leftComponent={<AccountImage />} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.scrollViewContentContainer}
        style={styles.flex}
      >
        <Box gap={16}>
          <RnbwStakingCard />
          <RnbwRewardsClaimCard />
          <RnbwAirdropClaimCard />
        </Box>
      </ScrollView>
    </Box>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingHorizontal: 20,
  },
});
