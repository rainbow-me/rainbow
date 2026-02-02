import { z } from 'zod';
import { platformResponseSchema } from '@/features/rnbw-rewards/schemas/platformResponseSchemas';
import { claimStatusSchema } from '@/features/rnbw-rewards/schemas/airdropClaimSchemas';

const typedDataFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const claimIntentResultSchema = z.object({
  intent: z.object({
    domain: z.object({
      chainId: z.string(),
      name: z.string(),
      verifyingContract: z.string(),
      version: z.string(),
    }),
    domainPrimaryType: z.string(),
    message: z.object({
      expiry: z.string(),
      nonce: z.string(),
      wallet: z.string(),
    }),
    types: z.object({
      Claim: z.array(typedDataFieldSchema),
      EIP712Domain: z.array(typedDataFieldSchema),
    }),
  }),
  intentId: z.string(),
});

export const claimRewardsResultSchema = z.object({
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

export const getClaimIntentResponseSchema = platformResponseSchema(claimIntentResultSchema);
export const claimRewardsResponseSchema = platformResponseSchema(claimRewardsResultSchema);
