import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsEarnings } from '@/screens/rewards/components/RewardsEarnings';
import { RewardsClaimed } from '@/screens/rewards/components/RewardsClaimed';
import { GetRewardsDataForWalletQuery } from '@/graphql/__generated__/metadata';
import { RewardsStats } from './RewardsStats';
import { RewardsLeaderboard } from '@/screens/rewards/components/RewardsLeaderboard';
import { RewardsDuneLogo } from '@/screens/rewards/components/RewardsDuneLogo';
import { RewardsFakeContent } from '@/screens/rewards/components/RewardsFakeContent';
import { RewardsProgramStatus } from '@/screens/rewards/components/RewardsProgramStatus';
import * as i18n from '@/languages';
import InfoAlert from '@/components/info-alert/info-alert';
import { Box, Text } from '@/design-system';
import { colors } from '@/styles';

type Props = {
  assetPrice?: number;
  data: GetRewardsDataForWalletQuery | undefined;
  isLoading?: boolean;
  isLoadingError?: boolean;
};

export const RewardsContent: React.FC<Props> = ({
  assetPrice,
  // data,
  isLoading,
  isLoadingError,
}) => {
  if (isLoading) {
    return <RewardsFakeContent />;
  }

  const data = {
    rewards: {
      meta: {
        title: 'Optimism Rewards',
        color: '#FFCC00',
        distribution: {
          next: 1634179200,
          left: 0,
          total: 0,
        },
        token: {
          asset: {
            iconURL:
              'https://assets.coingecko.com/coins/images/12504/small/optimism.png?1620935048',
            symbol: 'OPT',
          },
        },
      },
      stats: {
        actions: [],
        position: {
          current: 1,
          change: {
            h24: 0,
          },
        },
      },
      earnings: {
        pending: {
          token: 0,
        },
        total: {
          token: 0,
          usd: 0,
        },
      },
    },
  };

  if (isLoadingError || !data || !data.rewards) {
    return (
      <RewardsProgramStatus
        emoji="😵"
        title={i18n.t(i18n.l.rewards.error_title)}
        text={i18n.t(i18n.l.rewards.error_text)}
      />
    );
  }

  return (
    <Box height="full">
      <RewardsTitle text={data.rewards.meta.title} />
      <Box paddingBottom="20px">
        <InfoAlert
          title="Earn OP for swapping or bridging"
          description="Get cash back by swapping on or bridging to Optimism. Rewards distributed monthly."
          rightIcon={
            <Text size="20pt" color={{ custom: data.rewards.meta.color }}>
              􀫸
            </Text>
          }
        />
      </Box>
      {data.rewards.earnings && (
        <RewardsEarnings
          assetPrice={assetPrice}
          color={data.rewards.meta.color}
          nextAirdropTimestamp={data.rewards.meta.distribution.next}
          pendingEarningsToken={data.rewards.earnings?.pending.token ?? 0}
          tokenImageUrl={data.rewards.meta.token.asset.iconURL ?? ''}
          tokenSymbol={data.rewards.meta.token.asset.symbol}
          totalEarnings={data.rewards.earnings.total}
        />
      )}
      <RewardsClaimed
        assetPrice={assetPrice}
        color={data.rewards.meta.color}
        nextDistributionTimestamp={data.rewards.meta.distribution.next}
        remainingRewards={data.rewards.meta.distribution.left}
        tokenSymbol={data.rewards.meta.token.asset.symbol}
        totalAvailableRewardsInToken={data.rewards.meta.distribution.total}
      />
      <RewardsStats
        actions={data.rewards.stats?.actions ?? []}
        assetPrice={assetPrice}
        color={data.rewards.meta.color}
        position={data.rewards.stats?.position.current ?? 1}
        positionChange={data.rewards.stats?.position.change.h24 ?? 0}
      />
    </Box>
  );
};
