import { memo } from 'react';
import { Box, Text } from '@/design-system';
import { useMembershipTierInfo } from '@/features/rnbw-membership/stores/derived/useMembershipTierInfo';

export const MembershipTierCard = memo(function MembershipTierCard() {
  const { currentTier, stakeRequiredForNextTier, cashbackPercentage, currentTierProgress } = useMembershipTierInfo();

  return (
    <Box background="surfacePrimary" borderRadius={24} padding="20px" gap={20} shadow={'18px'}>
      <Text size="22pt" weight="heavy" color="label">
        {`${currentTier.name} Tier`}
      </Text>
      <Text size="17pt" weight="heavy" color="label">
        {`current tier progress: ${currentTierProgress * 100}/100`}
      </Text>
      <Text size="17pt" weight="heavy" color="label">
        {`Cashback: ${cashbackPercentage}%`}
      </Text>
      <Text size="17pt" weight="heavy" color="label">
        {`Stake to unlock: ${stakeRequiredForNextTier}`}
      </Text>
    </Box>
  );
});
