import { z } from 'zod';

import { DESTINATION_ROOTS, MARKET_DISPLAY_VALUES, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';

const surfaceIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const displayValues = [...MARKET_DISPLAY_VALUES, ...PREDICTION_DISPLAY_VALUES] as const;

const enabledSchema = z.union([
  z.boolean(),
  z
    .object({
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
    })
    .refine(schedule => schedule.startsAt !== undefined || schedule.endsAt !== undefined),
]);

const destinationSchema = z.union([z.null(), z.tuple([z.nativeEnum(DESTINATION_ROOTS)]).rest(z.string().min(1))]);

const nodeSchema = z.object({
  id: surfaceIdSchema,
  label: z.string().min(1),
  enabled: enabledSchema,
  updatedAt: z.string().datetime().optional(),
});

const leafSchema = nodeSchema.extend({
  placement: z.string().nullable().optional(),
  display: z.enum(displayValues),
  destination: destinationSchema,
  limit: z.number().int().min(1).optional(),
});

const sectionSchema = nodeSchema.extend({
  items: z.array(leafSchema),
});

export const surfaceSchema = z.object({
  id: surfaceIdSchema,
  version: z.literal(1),
  label: z.string().min(1).optional(),
  enabled: enabledSchema,
  updatedAt: z.string().datetime().optional(),
  items: z.array(sectionSchema),
});

export function parseSurfaceDocument(surfaceId: string, surface: unknown): z.infer<typeof surfaceSchema> {
  const parsed = surfaceSchema.parse(surface);
  if (parsed.id !== surfaceId) throw new Error(`Surface id mismatch: expected ${surfaceId}, received ${parsed.id}`);

  return parsed;
}
