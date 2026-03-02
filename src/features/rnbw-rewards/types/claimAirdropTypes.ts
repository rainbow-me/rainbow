import { type z } from 'zod';
import { type claimAirdropResponseSchema, type claimAirdropResultSchema } from '@/features/rnbw-rewards/schemas/airdropClaimSchemas';

export type ClaimAirdropResult = z.infer<typeof claimAirdropResultSchema>;
export type ClaimAirdropResponse = z.infer<typeof claimAirdropResponseSchema>;
