import { z } from 'zod';

export const platformMetadataSchema = z.object({
  requestTime: z.string(),
  responseTime: z.string(),
  requestId: z.string(),
  success: z.boolean(),
});

export const platformResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z
    .object({
      metadata: platformMetadataSchema,
      result: resultSchema,
    })
    .superRefine((data, ctx) => {
      if (!data.metadata.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Platform response was unsuccessful',
        });
      }
    });

const typedDataFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const typedDataTypesSchema = z
  .object({
    Claim: z.array(typedDataFieldSchema),
    EIP712Domain: z.array(typedDataFieldSchema),
  })
  .catchall(z.array(typedDataFieldSchema));

export const claimIntentResultSchema = z.object({
  intent: z.object({
    domain: z
      .object({
        chainId: z.string(),
        name: z.string(),
        verifyingContract: z.string(),
        version: z.string(),
      })
      .passthrough(),
    domainPrimaryType: z.string(),
    message: z
      .object({
        expiry: z.string(),
        nonce: z.string(),
        wallet: z.string(),
      })
      .passthrough(),
    types: typedDataTypesSchema,
  }),
  intentId: z.string(),
});

export const getClaimIntentResponseSchema = platformResponseSchema(claimIntentResultSchema);

export const claimRewardsResultSchema = z.object({
  chainId: z.string(),
  claimId: z.string(),
  claimedRnbw: z.string(),
  claimedValueInCurrency: z.string(),
  createdAt: z.string(),
  decimals: z.number(),
  errorMessage: z.string().nullable().optional(),
  processedAt: z.string().nullable().optional(),
  status: z.string(),
  tenderlyUrl: z.string().nullable().optional(),
  txHash: z.string().nullable().optional(),
  walletAddress: z.string(),
});

export const claimRewardsResponseSchema = platformResponseSchema(claimRewardsResultSchema);

type PlatformResponseResult<TSchema extends z.ZodTypeAny> = z.infer<TSchema> extends { result: infer R } ? R : never;

export function parsePlatformResult<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  response: { data?: unknown },
  context: string
): PlatformResponseResult<TSchema> {
  const parsed = schema.safeParse(response?.data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(issue => issue.message).join('; ');
    throw new Error(`[${context}]: invalid response${issues ? ` (${issues})` : ''}`);
  }
  return (parsed.data as z.infer<TSchema>).result as PlatformResponseResult<TSchema>;
}
