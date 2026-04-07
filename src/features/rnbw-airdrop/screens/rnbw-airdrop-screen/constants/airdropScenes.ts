export const RnbwAirdropScenes = {
  AirdropClaimPrompt: 'airdrop-claim-prompt',
  AirdropClaiming: 'airdrop-claiming',
  AirdropClaimed: 'airdrop-claimed',
} as const;

export type RnbwAirdropScene = (typeof RnbwAirdropScenes)[keyof typeof RnbwAirdropScenes];
