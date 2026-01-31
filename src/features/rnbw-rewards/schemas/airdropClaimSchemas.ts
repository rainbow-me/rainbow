import { z } from 'zod';
import { platformResponseSchema } from '@/features/rnbw-rewards/schemas/platformResponseSchemas';

export const claimStatusSchema = z.enum([
  'CLAIM_STATUS_UNSPECIFIED',
  'CLAIM_STATUS_PENDING',
  'CLAIM_STATUS_FAILED',
  'CLAIM_STATUS_CONFIRMED',
]);

export const claimAirdropResultSchema = z.object({
  chainId: z.string(),
  claimId: z.string(),
  claimedRnbw: z.string(),
  claimedValueInCurrency: z.string(),
  createdAt: z.string(),
  decimals: z.number(),
  processedAt: z.string().nullable().optional(),
  status: claimStatusSchema,
  tenderlyUrl: z.string().nullable().optional(),
  txHash: z.string().nullable().optional(),
  walletAddress: z.string(),
});

export const claimAirdropResponseSchema = platformResponseSchema(claimAirdropResultSchema);
