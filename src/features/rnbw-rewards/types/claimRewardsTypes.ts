import { z } from 'zod';
import {
  claimIntentResultSchema,
  claimRewardsResultSchema,
  claimRewardsResponseSchema,
  getClaimIntentResponseSchema,
} from '@/features/rnbw-rewards/schemas/rewardsClaimSchemas';
import { claimStatusSchema } from '@/features/rnbw-rewards/schemas/airdropClaimSchemas';

export type GetClaimIntentResult = z.infer<typeof claimIntentResultSchema>;
export type ClaimRewardsResult = z.infer<typeof claimRewardsResultSchema>;
export type GetClaimIntentResponse = z.infer<typeof getClaimIntentResponseSchema>;
export type ClaimRewardsResponse = z.infer<typeof claimRewardsResponseSchema>;

export type ClaimStatus = z.infer<typeof claimStatusSchema>;
