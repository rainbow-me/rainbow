import { memo } from 'react';
import { Box, Text } from '@/design-system';
import { useRnbwStakingPositionPnl } from '@/features/rnbw-staking/stores/derived/useRnbwStakingPositionPnl';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';

export const RnbwUnstakePenaltyRecoveryCard = memo(function RnbwUnstakePenaltyRecoveryCard() {
  const { exitFeeOffsetRatio, earnedFromExitFees, earningsRequiredToBreakEven } = useRnbwStakingPositionPnl();
  return (
    <Box background="surfacePrimary" borderRadius={24} padding="20px" gap={20} shadow={'18px'}>
      <Text size="17pt" weight="bold" color="label">
        {'Loyalty Progress'}
      </Text>
      <Text size="17pt" weight="bold" color="label">
        {exitFeeOffsetRatio}
      </Text>
      <Text size="15pt" weight="bold" color="labelSecondary">
        {`You've earned ${earnedFromExitFees} ${RNBW_SYMBOL} from the pool. Just ${earningsRequiredToBreakEven} ${RNBW_SYMBOL} more to reach pure profit.`}
      </Text>
    </Box>
  );
});
