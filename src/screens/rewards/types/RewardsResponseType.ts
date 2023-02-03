import { Network } from '@/helpers';

type OpRewardsDistribution = {
  next: number;
  rewards_total: number;
  rewards_left: number;
};

type OpRewardsStatus = 'ongoing' | 'paused' | 'finished';

type OpRewardsAsset = {
  asset_code: string;
  decimals: number;
  icon_url: string;
  name: string;
  network: `${Network}`;
  symbol: string;
};

type OpRewardsMeta = {
  title: string;
  next_distribution: number;
  distribution: OpRewardsDistribution;
  status: OpRewardsStatus;
  end: number;
  token: {
    asset: OpRewardsAsset;
  };
};

type OpRewardsValue = {
  usd: number;
  token: number;
};

type OpRewardsMultiplierBreakdownItem = {
  amount: number;
  qualifier: string;
};

type OpRewardsEarnings = {
  total: OpRewardsValue;
  multiplier: {
    amount: number;
    breakdown: OpRewardsMultiplierBreakdownItem[];
  };
  pending: OpRewardsValue;
};

type OpRewardsPosition = {
  current: number;
  change: {
    '24h': number;
  };
};

type OpRewardsActionType = 'bridge' | 'swap';

type OpRewardsAction = {
  type: OpRewardsActionType;
  amount: Pick<OpRewardsValue, 'usd'>;
  reward_percent: number;
};

type OpRewardsStats = {
  position: OpRewardsPosition;
  actions: OpRewardsAction[];
};

type OpRewardsLeaderboardItem = {
  address: string;
  ens?: string;
  avatar_url?: string;
  earnings: {
    base: OpRewardsValue;
    bonus: OpRewardsValue;
  };
};

export type RewardsResponseType = {
  meta: OpRewardsMeta;
  earnings: OpRewardsEarnings;
  stats: OpRewardsStats;
  leaderboard: OpRewardsLeaderboardItem[];
};
