import { z } from 'zod';
import { platformMetadataSchema } from '@/features/rnbw-rewards/schemas/platformResponseSchemas';

type PlatformMetadata = z.infer<typeof platformMetadataSchema>;

export type PlatformResponse<T> = {
  metadata: PlatformMetadata;
  result: T;
};
