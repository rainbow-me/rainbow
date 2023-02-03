import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsEarnings } from '@/screens/rewards/components/RewardsEarnings';
import { RewardsAvailable } from '@/screens/rewards/components/RewardsAvailable';
import {
  GetRewardsDataForWalletQuery,
  RewardsMetaStatus,
} from '@/graphql/__generated__/metadata';
import { RewardsStats } from './RewardsStats';
import { RewardsLeaderboard } from '@/screens/rewards/components/RewardsLeaderboard';
import { RewardsDuneLogo } from '@/screens/rewards/components/RewardsDuneLogo';
import { RewardsFakeContent } from '@/screens/rewards/components/RewardsFakeContent';
import { RewardsProgramStatus } from '@/screens/rewards/components/RewardsProgramStatus';
import * as i18n from '@/languages';

const LEADERBOARD_ITEMS_THRESHOLD = 50;

type Props = {
  assetPrice?: number;
  data: GetRewardsDataForWalletQuery | undefined;
  isLoading?: boolean;
  isLoadingError?: boolean;
};

export const RewardsContent: React.FC<Props> = ({
  assetPrice,
  data,
  isLoading,
  isLoadingError,
}) => {
  if (isLoading) {
    return <RewardsFakeContent />;
  }
  if (isLoadingError || !data || !data.rewards) {
    return (
      <RewardsProgramStatus
        emoji="😵"
        title={i18n.t(i18n.l.rewards.error_title)}
        text={i18n.t(i18n.l.rewards.error_text)}
      />
    );
  }
  if (data.rewards.meta.status === RewardsMetaStatus.Finished) {
    return (
      <RewardsProgramStatus
        emoji="💸"
        title={i18n.t(i18n.l.rewards.ended_title)}
        text={i18n.t(i18n.l.rewards.ended_text)}
      />
    );
  }
  if (data.rewards.meta.status === RewardsMetaStatus.Paused) {
    return (
      <RewardsProgramStatus
        emoji="⏸️"
        title={i18n.t(i18n.l.rewards.paused_title)}
        text={i18n.t(i18n.l.rewards.paused_text)}
      />
    );
  }
  const leaderboardData = data.rewards.leaderboard.accounts ?? [];
  const limitedLeaderboardData = leaderboardData.slice(
    0,
    LEADERBOARD_ITEMS_THRESHOLD
  );
  return (
    <>
      <RewardsTitle text={data.rewards.meta.title} />
      {data.rewards.earnings && (
        <RewardsEarnings
          assetPrice={assetPrice}
          totalEarnings={data.rewards.earnings.total}
          tokenImageUrl={data.rewards.meta.token.asset.iconURL ?? ''}
          tokenSymbol={data.rewards.meta.token.asset.symbol}
          pendingEarningsToken={data.rewards.earnings?.pending.token ?? 0}
          nextAirdropTimestamp={data.rewards.meta.distribution.next}
          color={data.rewards.meta.color}
        />
      )}
      <RewardsAvailable
        assetPrice={assetPrice}
        totalAvailableRewardsInToken={data.rewards.meta.distribution.total}
        remainingRewards={data.rewards.meta.distribution.left}
        nextDistributionTimestamp={data.rewards.meta.distribution.next}
        color={data.rewards.meta.color}
      />
      <RewardsStats
        assetPrice={assetPrice}
        position={data.rewards.stats?.position.current ?? 1}
        positionChange={data.rewards.stats?.position.change.h24 ?? 0}
        actions={data.rewards.stats?.actions ?? []}
        color={data.rewards.meta.color}
      />
      <RewardsLeaderboard
        leaderboard={limitedLeaderboardData}
        programEndTimestamp={data.rewards.meta.end}
        tokenSymbol={data.rewards.meta.token.asset.symbol}
      />
      <RewardsDuneLogo />
    </>
  );
};
