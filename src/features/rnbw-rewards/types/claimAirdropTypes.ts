import { z } from 'zod';
import { claimAirdropResponseSchema, claimAirdropResultSchema } from '@/features/rnbw-rewards/schemas/airdropClaimSchemas';

export type ClaimAirdropResult = z.infer<typeof claimAirdropResultSchema>;
export type ClaimAirdropResponse = z.infer<typeof claimAirdropResponseSchema>;
