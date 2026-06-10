import { type z } from 'zod';

import { type placementItemSchema, type placementSchema } from '@/features/placements/schema/placementContract';

// ============ Placement document contract =================================== //

export type PlacementId = string;

export type Placement = z.infer<typeof placementSchema>;
export type PlacementItem = z.infer<typeof placementItemSchema>;
export type PlacementSource = Placement['source'];
