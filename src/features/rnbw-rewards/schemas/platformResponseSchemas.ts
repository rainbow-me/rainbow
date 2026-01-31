import { z } from 'zod';

export const platformMetadataSchema = z.object({
  requestTime: z.string(),
  responseTime: z.string(),
  requestId: z.string(),
});

export const platformResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    metadata: platformMetadataSchema,
    result: resultSchema,
    errors: z.array(z.string()).optional(),
  });
