import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsTotalEarnings } from '@/screens/rewards/components/RewardsTotalEarnings';
import { RewardsPendingEarnings } from '@/screens/rewards/components/RewardsPendingEarnings';
import { Rewards } from '@/graphql/__generated__/metadata';
import { RewardsStats } from './RewardsStats';
import { RewardsLeaderboard } from '@/screens/rewards/components/RewardsLeaderboard';

type Props = { data: Rewards };

export const RewardsContent: React.FC<Props> = ({ data }) => (
  <>
    <RewardsTitle text={data.meta.title} />
    {data.earnings && (
      <RewardsTotalEarnings
        totalEarningsUsd={data.earnings.total.usd}
        multiplier={data.earnings.multiplier.amount}
        totalEarningsToken={data.earnings.total.token}
        tokenImageUrl={data.meta.token.asset.iconURL ?? ''}
        tokenSymbol={data.meta.token.asset.symbol}
        color={data.meta.color}
      />
    )}
    <RewardsPendingEarnings
      pendingEarningsUsd={data.earnings?.pending.usd ?? 0}
      nextAirdropTimestamp={data.meta.distribution.next}
    />
    <RewardsStats
      position={data.stats?.position.current ?? 1}
      positionChange={data.stats?.position.change.h24 ?? 0}
      actions={data.stats?.actions ?? []}
      color={data.meta.color}
    />
    <RewardsLeaderboard
      leaderboard={data.leaderboard.accounts ?? []}
      programEndTimestamp={data.meta.end}
      tokenSymbol={data.meta.token.asset.symbol}
    />
  </>
);
