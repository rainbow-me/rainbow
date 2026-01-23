export const RnbwRewardsScenes = {
  AirdropIntro: 'airdrop-introduction',
  AirdropEligibility: 'checking-airdrop',
  AirdropClaiming: 'claiming-airdrop',
  RewardsClaiming: 'claiming-rewards',
  AirdropClaimPrompt: 'claim-airdrop',
  AirdropClaimed: 'claim-airdrop-finished',
  AirdropUnavailable: 'no-airdrop-to-claim',
  RewardsOverview: 'rewards',
} as const;

export type RnbwRewardsScene = (typeof RnbwRewardsScenes)[keyof typeof RnbwRewardsScenes];
