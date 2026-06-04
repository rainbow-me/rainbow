import { z } from 'zod';

import { DESTINATION_ROOTS, DISPLAY_VALUES } from '@/features/placements/surfaces/constants';

export type Enabled = boolean | { startsAt?: string; endsAt?: string };

export type DestinationRoot = (typeof DESTINATION_ROOTS)[keyof typeof DESTINATION_ROOTS];

export type Destination = [DestinationRoot, ...string[]] | null;

export type Display = (typeof DISPLAY_VALUES)[number];

export type SurfaceId = string;

export type SectionId = string;

export type SurfaceNodeBase = {
  id: string;
  label?: string;
  enabled: Enabled;
  updatedAt?: string;
};

export type SurfaceDocument = SurfaceNodeBase & {
  version: 1;
  items: SurfaceNode[];
};

export type SurfaceContainerNode = SurfaceNodeBase & {
  items: SurfaceNode[];
};

export type SurfaceLeafNode = SurfaceNodeBase & {
  placement?: string | null;
  display: Display;
  destination: Destination;
  limit?: number;
};

export type SurfaceNode = SurfaceContainerNode | SurfaceLeafNode;

export type SurfaceBase = SurfaceNodeBase;
export type SurfaceContainer = SurfaceContainerNode;
export type SurfaceLeaf = SurfaceLeafNode;
export type Surface = SurfaceNode;

// ============ Surface document contract ==================================== //

const surfaceIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const enabledSchema = z.union([
  z.boolean(),
  z
    .object({
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
    })
    .strict()
    .refine(schedule => schedule.startsAt !== undefined || schedule.endsAt !== undefined),
]);

export const destinationSchema = z.union([
  z.null(),
  z.tuple([z.nativeEnum(DESTINATION_ROOTS)]).rest(z.string().min(1)),
]);

const surfaceNodeBaseSchema = z.object({
  id: surfaceIdSchema,
  label: z.string().min(1),
  enabled: enabledSchema,
  updatedAt: z.string().datetime().optional(),
});

let surfaceNodeSchema: z.ZodType<SurfaceNode>;

export const surfaceContainerNodeSchema: z.ZodType<SurfaceContainerNode> = surfaceNodeBaseSchema
  .extend({
    items: z.array(z.lazy(() => surfaceNodeSchema)),
  })
  .strict();

export const surfaceLeafNodeSchema: z.ZodType<SurfaceLeafNode> = surfaceNodeBaseSchema
  .extend({
    placement: surfaceIdSchema.nullable().optional(),
    display: z.enum(DISPLAY_VALUES),
    destination: destinationSchema,
    limit: z.number().int().min(1).optional(),
  })
  .strict();

surfaceNodeSchema = z.union([surfaceContainerNodeSchema, surfaceLeafNodeSchema]);

export { surfaceNodeSchema };

export const surfaceDocumentSchema: z.ZodType<SurfaceDocument> = z
  .object({
    id: surfaceIdSchema,
    version: z.literal(1),
    label: z.string().min(1).optional(),
    enabled: enabledSchema,
    updatedAt: z.string().datetime().optional(),
    items: z.array(surfaceNodeSchema),
  })
  .strict();
