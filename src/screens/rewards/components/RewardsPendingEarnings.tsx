import React from 'react';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { Columns, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import {
  differenceInDays,
  differenceInHours,
  fromUnixTime,
  subDays,
} from 'date-fns';

type Props = { pendingEarningsUsd: number; nextAirdropTimestamp: number };

export const RewardsPendingEarnings: React.FC<Props> = ({
  pendingEarningsUsd,
  nextAirdropTimestamp,
}) => {
  const today = new Date();
  const dayOfNextDistribution = fromUnixTime(nextAirdropTimestamp);
  const days = differenceInDays(today, dayOfNextDistribution);
  const hours = differenceInHours(subDays(today, days), dayOfNextDistribution);

  return (
    <RewardsSectionCard>
      <Columns>
        <Stack space="12px" alignHorizontal="left">
          <Text color="labelTertiary" size="15pt" weight="semibold">
            {i18n.t(i18n.l.rewards.pending_earnings)}
          </Text>
          <Text color="label" size="26pt" weight="heavy">
            {`$${pendingEarningsUsd}`}
          </Text>
        </Stack>
        <Stack space="12px" alignHorizontal="right">
          <Text color="labelTertiary" size="15pt" weight="semibold">
            {i18n.t(i18n.l.rewards.next_airdrop)}
          </Text>
          <Text
            size="22pt"
            color="labelSecondary"
            weight="semibold"
          >{`􀧞 ${days}d ${hours}h`}</Text>
        </Stack>
      </Columns>
    </RewardsSectionCard>
  );
};
