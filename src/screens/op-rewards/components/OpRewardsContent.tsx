import React from 'react';
import { OpRewardsTitle } from '@/screens/op-rewards/components/OpRewardsTitle';
import { OpRewardsTotalEarnings } from '@/screens/op-rewards/components/OpRewardsTotalEarnings';
import { OpRewardsResponseType } from '@/screens/op-rewards/types/OpRewardsResponseType';

type Props = { data: OpRewardsResponseType };

export const OpRewardsContent: React.FC<Props> = ({ data }) => {
  return (
    <>
      <OpRewardsTitle text={data.meta.title} />
      <OpRewardsTotalEarnings />
    </>
  );
};
