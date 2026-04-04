import { memo } from 'react';
import { Box, Separator, Text } from '@/design-system';
import { useRnbwStakingEarnings } from '@/features/rnbw-staking/stores/derived/useRnbwStakingEarnings';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import rnbwCoinImage from '@/assets/rnbw.png';
import { Image } from 'react-native';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';
import * as i18n from '@/languages';
import { isZero } from '@/helpers/utilities';

export const RnbwStakingEarningsCard = memo(function RnbwStakingEarningsCard() {
  const { totalEarnings, cashbackEarnings, exitRewardsEarnings } = useRnbwStakingEarnings();

  const isZeroTotalEarnings = isZero(totalEarnings);

  return (
    <MembershipCard padding="24px">
      <Box gap={16}>
        <Text size="17pt" weight="bold" color="labelTertiary" align="left">
          {i18n.t(i18n.l.rnbw_membership.staking_earnings_card.lifetime_earnings)}
        </Text>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <Image source={rnbwCoinImage} style={{ width: 40, height: 40 }} />
          <Text size="34pt" weight="bold" color={isZeroTotalEarnings ? 'labelQuaternary' : 'label'}>
            {totalEarnings}
          </Text>
        </Box>
        <Separator color="separatorTertiary" thickness={1} />
        <Box gap={14}>
          <EarningsRow label={i18n.t(i18n.l.rnbw_membership.shared.fee_cashback)} amount={cashbackEarnings} />
          <Separator color="separatorTertiary" thickness={1} />
          <EarningsRow label={i18n.t(i18n.l.rnbw_membership.staking_earnings_card.exit_fee_rewards)} amount={exitRewardsEarnings} />
        </Box>
      </Box>
    </MembershipCard>
  );
});

const EarningsRow = memo(function EarningsRow({ label, amount }: { label: string; amount: string }) {
  const isZeroAmount = isZero(amount);
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
      <Box flexDirection="row" alignItems="center" gap={6}>
        <Text size="17pt" weight="bold" color="label">
          {label}
        </Text>
      </Box>
      <Box flexDirection="row" alignItems="center" gap={2}>
        <Text size="17pt" weight="bold" color={isZeroAmount ? 'labelQuaternary' : 'green'}>
          {amount}
        </Text>
        <Text size="17pt" weight="bold" color={isZeroAmount ? 'labelQuaternary' : 'green'}>
          {RNBW_SYMBOL}
        </Text>
      </Box>
    </Box>
  );
});
