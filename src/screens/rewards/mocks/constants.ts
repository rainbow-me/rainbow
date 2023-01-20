import { RewardsResponseType } from '@/screens/rewards/types/RewardsResponseType';

export const MOCK_REWARDS_DATA: RewardsResponseType = {
  meta: {
    title: 'Optimism Rewards',
    // Unix timestamp in UTC. "Next Airdrop" in Figma.
    next_distribution: 1673341200,
    distribution: {
      next: 1673341200,
      rewards_total: 28000.0,
      rewards_left: 25597.248,
    },
    // Possible statuses are: `ongoing`, `paused`, `finished`
    status: 'ongoing',
    // Unix timestamp in UTC. "Days left" in Figma.
    end: 1675983600,
    token: {
      asset: {
        asset_code: '0x4200000000000000000000000000000000000042',
        decimals: 18,
        icon_url:
          'https://rainbowme-res.cloudinary.com/image/upload/v1668486694/assets/optimism/0x4200000000000000000000000000000000000042.png',
        name: 'Optimism',
        network: 'optimism',
        symbol: 'OP',
      },
    },
  },
  earnings: {
    total: {
      usd: 229.25,
      token: 201.502,
    },
    multiplier: {
      amount: 2,
      breakdown: [
        {
          amount: 1.0,
          qualifier: 'Base',
        },
        {
          amount: 0.25,
          qualifier: 'Has previously swapped in Rainbow',
        },
        {
          amount: 0.25,
          qualifier: 'Has previously bridged in Rainbow',
        },
        {
          amount: 0.25,
          qualifier: 'Has deposited to Aave or Compound on Optimism',
        },
        {
          amount: 0.25,
          qualifier: 'Has deposited to PoolTogether on Optimism',
        },
      ],
    },
    pending: {
      usd: 24.82,
      token: 21.816,
    },
  },
  stats: {
    position: {
      current: 482,
      change: {
        '24h': 98, // May be negative.
      },
    },
    actions: [
      {
        type: 'swap',
        amount: {
          usd: 21524.01,
        },
        reward_percent: 0.0085, // == 0.85%. Range is [0; 1].
      },
      {
        type: 'bridge',
        amount: {
          usd: 200.82,
        },
        reward_percent: 0.0025, // == 0.25%. Range is [0; 1].
      },
    ],
  },
  // If client wants to get only leaderboard, it can omit the `address` argument in query and request only `leaderboard` field
  leaderboard: [
    // Ordered leaderboard. Client will decide which labels (e.g. #1, #2, #3 with medals) to display.
    {
      address: '0xc8ba12882c3547b5fb3bd215f474af365a55157a',
      // May be null
      ens: 'mikearndt.eth',
      // May be null
      avatar_url: 'https://example.com/image.jpg',
      earnings: {
        base: {
          usd: 2504.37,
          token: 2201.25,
        },
        bonus: {
          usd: 11377.06,
          token: 10000,
        },
      },
    },
  ],
};
