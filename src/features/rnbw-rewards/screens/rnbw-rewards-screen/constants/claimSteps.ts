export const ClaimSteps = {
  AirdropIntroduction: 'airdrop-introduction',
  CheckingAirdrop: 'checking-airdrop',
  ClaimingAirdrop: 'claiming-airdrop',
  ClaimingRewards: 'claiming-rewards',
  ClaimAirdrop: 'claim-airdrop',
  ClaimAirdropFinished: 'claim-airdrop-finished',
  NoAirdropToClaim: 'no-airdrop-to-claim',
  Rewards: 'rewards',
} as const;

export type ClaimStep = (typeof ClaimSteps)[keyof typeof ClaimSteps];
