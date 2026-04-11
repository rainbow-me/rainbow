export type TierId =
  | 'STAKING_TIER_LEVEL_BASIC'
  | 'STAKING_TIER_LEVEL_SILVER'
  | 'STAKING_TIER_LEVEL_GOLD'
  | 'STAKING_TIER_LEVEL_DIAMOND'
  | 'STAKING_TIER_LEVEL_BLACK';

export type Tier = {
  level: TierId;
  name: string;
  cashbackBps: number;
  minStakeAmount: string;
};
