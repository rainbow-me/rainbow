import { z } from 'zod';
import {
  claimIntentResultSchema,
  claimRewardsResultSchema,
  claimRewardsResponseSchema,
  getClaimIntentResponseSchema,
  platformMetadataSchema,
} from '@/features/rnbw-rewards/schemas/claimRewardsSchemas';

export type PlatformMetadata = z.infer<typeof platformMetadataSchema>;

export type PlatformResponseShape<T> = {
  metadata: PlatformMetadata;
  result: T;
};

export type GetClaimIntentResult = z.infer<typeof claimIntentResultSchema>;
export type ClaimRewardsResult = z.infer<typeof claimRewardsResultSchema>;
export type GetClaimIntentResponse = z.infer<typeof getClaimIntentResponseSchema>;
export type ClaimRewardsResponse = z.infer<typeof claimRewardsResponseSchema>;
