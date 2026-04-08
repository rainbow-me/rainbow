import { memo } from 'react';
import { Box, Separator, Text, useColorMode } from '@/design-system';
import { useRnbwStakingPositionPnl } from '@/features/rnbw-staking/stores/derived/useRnbwStakingPositionPnl';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { ProgressMeter } from '@/features/rnbw-membership/components/ProgressMeter';
import { MembershipCard } from '@/features/rnbw-membership/screens/rnbw-membership-screen/components/MembershipCard';
import { formatNumber } from '@/helpers/strings';

export const RnbwUnstakePenaltyRecoveryCard = memo(function RnbwUnstakePenaltyRecoveryCard() {
  const { isDarkMode } = useColorMode();
  const { exitFeeOffsetRatio, exitFeeOffsetRatioDisplay, earnedFromExitFees, earningsRequiredToBreakEven, isPositivePnl } =
    useRnbwStakingPositionPnl();

  return (
    <MembershipCard padding="24px">
      <Box gap={16}>
        <Box flexDirection="row" alignItems="center" gap={16}>
          <ProgressMeter progress={Number(exitFeeOffsetRatio)} height={63} width={24} notchWidth={6} notchHeight={2} />
          <Box gap={16}>
            <Text size="17pt" weight="bold" color="labelTertiary">
              {'Loyalty Progress'}
            </Text>
            <Text size="34pt" weight="heavy" color="green">
              {exitFeeOffsetRatioDisplay}
            </Text>
          </Box>
        </Box>
        <Separator color="separatorTertiary" thickness={1} />
        {isPositivePnl ? (
          <Text size="15pt" weight="medium" color="labelTertiary">
            {'Break even reached!'}
          </Text>
        ) : (
          <Text size="15pt" weight="medium" color="labelTertiary">
            {"You've earned "}
            <Text size="15pt" weight="bold" color={isDarkMode ? 'labelSecondary' : 'label'}>
              {`${formatNumber(earnedFromExitFees, { decimals: 2 })} ${RNBW_SYMBOL}`}
            </Text>
            {' from the pool. Just '}
            <Text size="15pt" weight="bold" color={isDarkMode ? 'labelSecondary' : 'label'}>
              {`${formatNumber(earningsRequiredToBreakEven, { decimals: 2 })} ${RNBW_SYMBOL}`}
            </Text>
            {' more to reach pure profit.'}
          </Text>
        )}
      </Box>
    </MembershipCard>
  );
});
