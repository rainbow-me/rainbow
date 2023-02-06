import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsEarnings } from '@/screens/rewards/components/RewardsEarnings';
import { RewardsAvailable } from '@/screens/rewards/components/RewardsAvailable';
import { Rewards } from '@/graphql/__generated__/metadata';
import { RewardsStats } from './RewardsStats';
import { RewardsLeaderboard } from '@/screens/rewards/components/RewardsLeaderboard';
import { RewardsDuneLogo } from '@/screens/rewards/components/RewardsDuneLogo';

const LEADERBOARD_ITEMS_TRESHOLD = 50;

type Props = { data: Rewards };

export const RewardsContent: React.FC<Props> = ({ data }) => {
  const leaderboardData = data.leaderboard.accounts ?? [];
  const limitedLeaderboardData = leaderboardData.slice(
    0,
    LEADERBOARD_ITEMS_TRESHOLD
  );
  return (
    <>
      <RewardsTitle text={data.meta.title} />
      {data.earnings && (
        <RewardsEarnings
          totalEarnings={data.earnings.total}
          tokenImageUrl={data.meta.token.asset.iconURL ?? ''}
          tokenSymbol={data.meta.token.asset.symbol}
          pendingEarningsToken={data.earnings?.pending.token ?? 0}
          nextAirdropTimestamp={data.meta.distribution.next}
          color={data.meta.color}
        />
      )}
      <RewardsAvailable
        totalAvailableRewards={data.meta.distribution.total}
        remainingRewards={data.meta.distribution.left}
        nextDistributionTimestamp={data.meta.distribution.next}
        color={data.meta.color}
      />
      <RewardsStats
        position={data.stats?.position.current ?? 1}
        positionChange={data.stats?.position.change.h24 ?? 0}
        actions={data.stats?.actions ?? []}
        color={data.meta.color}
      />
      <RewardsLeaderboard
        leaderboard={limitedLeaderboardData}
        programEndTimestamp={data.meta.end}
        tokenSymbol={data.meta.token.asset.symbol}
      />
      <RewardsDuneLogo />
    </>
  );
};
