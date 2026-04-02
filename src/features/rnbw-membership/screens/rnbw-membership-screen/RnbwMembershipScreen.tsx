import { memo, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { Box } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { RnbwRewardsClaimCard } from './components/RnbwRewardsClaimCard';
import { RnbwAirdropClaimCard } from './components/RnbwAirdropClaimCard';
import { RnbwUnstakePenaltyRecoveryCard } from './components/RnbwUnstakePenaltyRecoveryCard';
import { RnbwStakingCard } from './components/RnbwStakingCard';
import { MembershipTierCard } from './components/MembershipTierCard';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { RnbwStakingEarningsCard } from './components/RnbwStakingEarningsCard';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const hasPosition = useStakingPositionStore(s => s.hasPosition());

  return (
    <Box background="surfaceSecondary" style={styles.flex}>
      <Navbar hasStatusBarInset title="Membership" leftComponent={<AccountImage />} />
      <ScrollView
        refreshControl={<RefreshControlWrapper />}
        contentContainerStyle={styles.scrollViewContentContainer}
        style={styles.flex}
        contentInset={{
          bottom: TAB_BAR_HEIGHT + 16,
        }}
      >
        <Box gap={16} style={{ flex: 1 }}>
          <RnbwStakingCard />
          {hasPosition && <RnbwStakingEarningsCard />}
          {hasPosition && <RnbwUnstakePenaltyRecoveryCard />}
          <MembershipTierCard />
          <RnbwRewardsClaimCard />
          <RnbwAirdropClaimCard />
        </Box>
      </ScrollView>
    </Box>
  );
});

function RefreshControlWrapper() {
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

  return <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingHorizontal: 20,
  },
});
