import React from 'react';
import { Box, Columns, Rows, Separator, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { RewardsLeaderboardEntry } from '@/graphql/__generated__/metadata';
import { RewardsLeaderboardItem } from '@/screens/rewards/components/RewardsLeaderboardItem';
import { differenceInDays, fromUnixTime } from 'date-fns';

type Props = {
  tokenSymbol: string;
  leaderboard: RewardsLeaderboardEntry[];
  programEndTimestamp: number;
};

export const RewardsLeaderboard: React.FC<Props> = ({
  leaderboard,
  programEndTimestamp,
  tokenSymbol,
}) => {
  const daysLeft = differenceInDays(
    fromUnixTime(programEndTimestamp),
    new Date()
  );
  return (
    <>
      <Columns>
        <Text size="20pt" weight="heavy" color="label">
          {i18n.t(i18n.l.rewards.leaderboard)}
        </Text>
        <Text
          align="right"
          size="20pt"
          weight="semibold"
          color="labelTertiary"
        >{`${daysLeft} ${i18n.t(i18n.l.rewards.days_left)}`}</Text>
      </Columns>
      <Box paddingVertical="16px">
        <RewardsSectionCard>
          <Stack
            space="10px"
            separator={<Separator color="separatorTertiary" />}
          >
            {leaderboard.map((entry, index) => (
              <RewardsLeaderboardItem
                key={`${entry.address}${index}`}
                rank={index + 1}
                avatarUrl={entry.avatarURL ?? undefined}
                address={entry.address}
                ens={entry.ens ?? undefined}
                amountEarnedInToken={entry.earnings.base.token}
                bonusEarnedInToken={entry.earnings.bonus.token}
                tokenSymbol={tokenSymbol}
              />
            ))}
          </Stack>
        </RewardsSectionCard>
      </Box>
    </>
  );
};
