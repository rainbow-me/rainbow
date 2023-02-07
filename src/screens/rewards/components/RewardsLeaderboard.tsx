import React from 'react';
import { Box, Columns, Separator, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';
import { RewardsSectionCard } from '@/screens/rewards/components/RewardsSectionCard';
import { RewardsLeaderboardItem } from '@/screens/rewards/components/RewardsLeaderboardItem';
import { differenceInDays, format, fromUnixTime } from 'date-fns';
import {
  RewardsLeaderboardAccount,
  RewardsMetaStatus,
} from '@/graphql/__generated__/metadata';

type GetRHSValueBasedOnStatusParams =
  | {
      status: RewardsMetaStatus.Paused;
    }
  | {
      status: RewardsMetaStatus.Finished;
    }
  | {
      status: RewardsMetaStatus.Ongoing;
      value: string;
    };

const getRHSValueBasedOnStatus = (
  status: RewardsMetaStatus,
  daysLeftValue: number
) => {
  switch (status) {
    case RewardsMetaStatus.Paused:
      return i18n.t(i18n.l.rewards.program_paused);
    case RewardsMetaStatus.Finished:
      return i18n.t(i18n.l.rewards.program_finished);
    default:
      return i18n.t(i18n.l.rewards.days_left, {
        days: daysLeftValue,
      });
  }
};

type Props = {
  status: RewardsMetaStatus;
  leaderboard: RewardsLeaderboardAccount[];
  programEndTimestamp: number;
  tokenSymbol: string;
};

export const RewardsLeaderboard: React.FC<Props> = ({
  status,
  leaderboard,
  programEndTimestamp,
  tokenSymbol,
}) => {
  const daysLeft = differenceInDays(
    fromUnixTime(programEndTimestamp),
    new Date()
  );

  return (
    <Box paddingBottom="28px">
      <Stack space="12px">
        <Columns>
          <Text size="20pt" weight="heavy" color="label">
            {i18n.t(i18n.l.rewards.leaderboard)}
          </Text>
          <Text
            align="right"
            size="20pt"
            weight="semibold"
            color="labelTertiary"
          >
            {getRHSValueBasedOnStatus(status, daysLeft)}
          </Text>
        </Columns>
        {status === RewardsMetaStatus.Paused && (
          <Text weight="semibold" size="13pt" color="labelQuaternary">
            {i18n.t(i18n.l.rewards.program_paused_will_resume)}
          </Text>
        )}
        {status === RewardsMetaStatus.Finished && (
          <Text weight="semibold" size="13pt" color="labelQuaternary">
            {i18n.t(i18n.l.rewards.program_finished_description)}
          </Text>
        )}
      </Stack>
      <Box paddingTop={status !== RewardsMetaStatus.Ongoing ? '12px' : '16px'}>
        <RewardsSectionCard paddingVertical="10px" paddingHorizontal="16px">
          <Stack
            space="10px"
            separator={<Separator color="separatorTertiary" />}
          >
            {leaderboard.map((entry, index) => (
              <RewardsLeaderboardItem
                key={entry.address}
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
    </Box>
  );
};
