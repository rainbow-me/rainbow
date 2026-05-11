import type { Tier } from '@/features/rnbw-membership/types';

export const FALLBACK_TIERS: Tier[] = [
  {
    level: 'STAKING_TIER_LEVEL_BASIC',
    name: 'Basic',
    minStakeAmount: '0',
    cashbackBps: 1000,
  },
  {
    level: 'STAKING_TIER_LEVEL_SILVER',
    name: 'Silver',
    minStakeAmount: '5000000000000000000000',
    cashbackBps: 2500,
  },
  {
    level: 'STAKING_TIER_LEVEL_GOLD',
    name: 'Gold',
    minStakeAmount: '10000000000000000000000',
    cashbackBps: 5000,
  },
  {
    level: 'STAKING_TIER_LEVEL_DIAMOND',
    name: 'Diamond',
    minStakeAmount: '15000000000000000000000',
    cashbackBps: 7500,
  },
  {
    level: 'STAKING_TIER_LEVEL_BLACK',
    name: 'Black',
    minStakeAmount: '20000000000000000000000',
    cashbackBps: 10000,
  },
];

export const MEMBERSHIP_SCREEN_BACKGROUND_COLOR = {
  light: '#F5F5F7',
  dark: '#090909',
};
