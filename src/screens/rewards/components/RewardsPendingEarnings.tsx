import React from 'react';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { Box, Columns, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import {
  addDays,
  differenceInDays,
  differenceInHours,
  fromUnixTime,
  isPast,
} from 'date-fns';

type Props = { pendingEarningsUsd: number; nextAirdropTimestamp: number };

export const RewardsPendingEarnings: React.FC<Props> = ({
  pendingEarningsUsd,
  nextAirdropTimestamp,
}) => {
  const today = new Date();
  const dayOfNextDistribution = fromUnixTime(nextAirdropTimestamp);
  const days = differenceInDays(dayOfNextDistribution, today);
  const hours = differenceInHours(dayOfNextDistribution, addDays(today, days));

  const airdropTitle = isPast(dayOfNextDistribution)
    ? i18n.t(i18n.l.rewards.last_airdrop)
    : i18n.t(i18n.l.rewards.next_airdrop);
  const airdropTime = `${Math.abs(days)}d ${Math.abs(hours)}h`;

  return (
    <Box paddingBottom="36px">
      <RewardsSectionCard>
        <Columns>
          <Stack space="12px" alignHorizontal="left">
            <Text color="labelTertiary" size="15pt" weight="semibold">
              {i18n.t(i18n.l.rewards.pending_earnings)}
            </Text>
            <Text color="label" size="22pt" weight="heavy">
              {`$${pendingEarningsUsd}`}
            </Text>
          </Stack>
          <Stack space="12px" alignHorizontal="right">
            <Text color="labelTertiary" size="15pt" weight="semibold">
              {airdropTitle}
            </Text>
            <Text
              size="22pt"
              color="labelSecondary"
              weight="semibold"
            >{`􀧞 ${airdropTime}`}</Text>
          </Stack>
        </Columns>
      </RewardsSectionCard>
    </Box>
  );
};
