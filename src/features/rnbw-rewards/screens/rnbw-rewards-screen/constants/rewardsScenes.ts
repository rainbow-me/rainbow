export const RnbwRewardsScenes = {
  AirdropIntro: 'airdrop-intro',
  AirdropEligibility: 'airdrop-eligibility',
  AirdropClaiming: 'airdrop-claiming',
  RewardsClaiming: 'rewards-claiming',
  AirdropClaimPrompt: 'airdrop-claim-prompt',
  AirdropClaimed: 'airdrop-claimed',
  RewardsClaimed: 'rewards-claimed',
  AirdropUnavailable: 'airdrop-unavailable',
  RewardsOverview: 'rewards-overview',
} as const;

export type RnbwRewardsScene = (typeof RnbwRewardsScenes)[keyof typeof RnbwRewardsScenes];
