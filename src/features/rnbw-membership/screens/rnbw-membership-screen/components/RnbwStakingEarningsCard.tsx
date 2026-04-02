import { memo } from 'react';
import { Box, Separator, Text } from '@/design-system';
import { useRnbwStakingEarnings } from '@/features/rnbw-staking/stores/derived/useRnbwStakingEarnings';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import rnbwCoinImage from '@/assets/rnbw.png';
import { Image } from 'react-native';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';

export const RnbwStakingEarningsCard = memo(function RnbwStakingEarningsCard() {
  const { totalEarnings, cashbackEarnings, cashbackShare, exitRewardsEarnings, exitRewardsShare } = useRnbwStakingEarnings();

  return (
    <MembershipCard padding="24px">
      <Box gap={16}>
        <Text size="17pt" weight="bold" color="labelTertiary" align="left">
          {'Total Earnings'}
        </Text>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <Image source={rnbwCoinImage} style={{ width: 40, height: 40 }} />
          <Text size="34pt" weight="bold" color="label">
            {totalEarnings}
          </Text>
        </Box>
        <Separator color="separatorTertiary" thickness={1} />
        <Box gap={14}>
          <EarningsRow label="Cashback" percentage={cashbackShare} amount={cashbackEarnings} />
          <Separator color="separatorTertiary" thickness={1} />
          <EarningsRow label="Exit Rewards" percentage={exitRewardsShare} amount={exitRewardsEarnings} />
        </Box>
      </Box>
    </MembershipCard>
  );
});

const EarningsRow = memo(function EarningsRow({ label, percentage, amount }: { label: string; percentage: string; amount: string }) {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
      <Box flexDirection="row" alignItems="center" gap={6}>
        <Text size="17pt" weight="bold" color="label">
          {label}
        </Text>
        <Text size="17pt" weight="bold" color="labelQuaternary">
          {percentage}
        </Text>
      </Box>
      <Box flexDirection="row" alignItems="center" gap={2}>
        <Text size="17pt" weight="bold" color={'green'}>
          {amount}
        </Text>
        <Text size="17pt" weight="bold" color={'green'}>
          {RNBW_SYMBOL}
        </Text>
      </Box>
    </Box>
  );
});
