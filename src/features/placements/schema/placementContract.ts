import { z } from 'zod';

import { PLACEMENT_SOURCES } from '@/features/placements/constants';

export const placementItemSchema = z.object({
  id: z.string().min(1),
  endsAt: z.string().datetime().optional(),
  startsAt: z.string().datetime().optional(),
});

const baseSchema = z.object({
  id: z.string(),
  version: z.literal(2),
  updatedAt: z.string().datetime().optional(),
  items: z.array(placementItemSchema),
});

export const placementSchema = z.discriminatedUnion('source', [
  baseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.HYPERLIQUID),
  }),
  baseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.POLYMARKET),
  }),
  baseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.RAINBOW),
  }),
]);
