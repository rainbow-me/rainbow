import { z } from 'zod';
import { claimAirdropResponseSchema, claimAirdropResultSchema } from '@/features/rnbw-rewards/schemas/claimAirdropSchemas';

export type ClaimAirdropResult = z.infer<typeof claimAirdropResultSchema>;
export type ClaimAirdropResponse = z.infer<typeof claimAirdropResponseSchema>;
