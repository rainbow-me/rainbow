import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsEarnings } from '@/screens/rewards/components/RewardsEarnings';
import { GetRewardsDataForWalletQuery } from '@/graphql/__generated__/metadata';
import { RewardsStats } from './RewardsStats';
import { RewardsFakeContent } from '@/screens/rewards/components/RewardsFakeContent';
import { RewardsProgramStatus } from '@/screens/rewards/components/RewardsProgramStatus';
import * as i18n from '@/languages';
import { InfoAlert } from '@/components/info-alert/info-alert';
import { Box, Text } from '@/design-system';

type Props = {
  assetPrice?: number;
  data: GetRewardsDataForWalletQuery | undefined;
  isLoading?: boolean;
  isLoadingError?: boolean;
};

export const RewardsContent: React.FC<Props> = ({ assetPrice, data, isLoading, isLoadingError }) => {
  if (isLoading) {
    return <RewardsFakeContent />;
  }

  if (isLoadingError || !data || !data.rewards) {
    return <RewardsProgramStatus emoji="😵" title={i18n.t(i18n.l.rewards.error_title)} text={i18n.t(i18n.l.rewards.error_text)} />;
  }

  return (
    <Box height="full">
      <RewardsTitle text={data.rewards.meta.title} />
      <Box paddingBottom="20px">
        <InfoAlert
          title={i18n.t(i18n.l.rewards.info.title)}
          description={i18n.t(i18n.l.rewards.info.description)}
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
      {data.rewards.stats && (
        <RewardsStats actions={data.rewards.stats?.actions ?? []} assetPrice={assetPrice} color={data.rewards.meta.color} />
      )}
    </Box>
  );
};
