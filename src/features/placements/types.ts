import { z } from 'zod';

import { PLACEMENT_SOURCES, PLACEMENT_TYPES } from '@/features/placements/constants';

// ============ Placement document contract =================================== //

export type PlacementId = string;

const placementIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const placementItemSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

const placementBaseSchema = z
  .object({
    id: placementIdSchema,
    version: z.literal(2),
    updatedAt: z.string().datetime().optional(),
    items: z.array(placementItemSchema),
  })
  .strict();

export const placementDocumentSchema = z.discriminatedUnion('source', [
  placementBaseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.HYPERLIQUID),
    type: z.literal(PLACEMENT_TYPES.PERP),
  }),
  placementBaseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.POLYMARKET),
    type: z.literal(PLACEMENT_TYPES.PREDICTION),
  }),
  placementBaseSchema.extend({
    source: z.literal(PLACEMENT_SOURCES.RAINBOW),
    type: z.literal(PLACEMENT_TYPES.TOKEN),
  }),
]);

export type Placement = z.infer<typeof placementDocumentSchema>;
export type PlacementItem = z.infer<typeof placementItemSchema>;
export type PlacementSource = Placement['source'];
export type PlacementType = Placement['type'];

// ============ Analytics ====================================================== //

export type PlacementItemAnalyticsMetadata = {
  marketId?: string;
  marketName?: string;
  marketSlug?: string;
  marketSymbol?: string;
};
