import { type z } from 'zod';
import { type platformMetadataSchema } from '@/features/rnbw-rewards/schemas/platformResponseSchemas';

type PlatformMetadata = z.infer<typeof platformMetadataSchema>;

export type PlatformResponse<T> = {
  metadata: PlatformMetadata;
  result: T;
};
