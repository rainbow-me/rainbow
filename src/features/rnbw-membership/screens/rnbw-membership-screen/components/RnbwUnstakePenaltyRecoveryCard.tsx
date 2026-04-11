import { memo } from 'react';

import { Box, Separator, Text, useColorMode } from '@/design-system';
import { ProgressMeter } from '@/features/rnbw-membership/components/ProgressMeter';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useRnbwStakingEarnings } from '@/features/rnbw-staking/stores/derived/useRnbwStakingEarnings';
import { useRnbwStakingPositionPnl } from '@/features/rnbw-staking/stores/derived/useRnbwStakingPositionPnl';
import * as i18n from '@/languages';

export const RnbwUnstakePenaltyRecoveryCard = memo(function RnbwUnstakePenaltyRecoveryCard() {
  const { isDarkMode } = useColorMode();
  const { exitRewardsEarnings } = useRnbwStakingEarnings();
  const { exitFeeOffsetRatio, exitFeeOffsetRatioDisplay, earningsRequiredToBreakEven, isPositivePnl } = useRnbwStakingPositionPnl();

  return (
    <MembershipCard padding="24px">
      <Box gap={16}>
        <Box flexDirection="row" alignItems="center" gap={16}>
          <ProgressMeter progress={Number(exitFeeOffsetRatio)} height={63} width={24} notchWidth={6} notchHeight={2} />
          <Box gap={16}>
            <Text size="17pt" weight="bold" color="labelTertiary">
              {i18n.t(i18n.l.rnbw_membership.shared.loyalty_progress)}
            </Text>
            <Text size="34pt" weight="heavy" color="green">
              {exitFeeOffsetRatioDisplay}
            </Text>
          </Box>
        </Box>
        <Separator color="separatorTertiary" thickness={1} />
        {isPositivePnl ? (
          <Text size="15pt" weight="medium" color="labelTertiary">
            {i18n.t(i18n.l.rnbw_membership.unstake_penalty_recovery_card.break_even_reached)}
          </Text>
        ) : (
          <Text size="15pt" weight="medium" color="labelTertiary">
            {i18n.t(i18n.l.rnbw_membership.unstake_penalty_recovery_card.earned_prefix)}
            <Text size="15pt" weight="bold" color={isDarkMode ? 'labelSecondary' : 'label'}>
              {`${exitRewardsEarnings} ${RNBW_SYMBOL}`}
            </Text>
            {i18n.t(i18n.l.rnbw_membership.unstake_penalty_recovery_card.earned_middle)}
            <Text size="15pt" weight="bold" color={isDarkMode ? 'labelSecondary' : 'label'}>
              {`${earningsRequiredToBreakEven} ${RNBW_SYMBOL}`}
            </Text>
            {i18n.t(i18n.l.rnbw_membership.unstake_penalty_recovery_card.earned_suffix)}
          </Text>
        )}
      </Box>
    </MembershipCard>
  );
});
