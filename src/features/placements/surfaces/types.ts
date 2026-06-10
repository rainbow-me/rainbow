import { type z } from 'zod';

import { type surfaceSchema } from '@/features/placements/surfaces/schema/surfaceContract';

export type SurfaceDocument = z.infer<typeof surfaceSchema>;
export type SurfaceSectionNode = SurfaceDocument['items'][number];
export type SurfaceLeafNode = SurfaceSectionNode['items'][number];

export type Destination = SurfaceLeafNode['destination'];
export type DestinationRoot = NonNullable<Destination>[0];
export type Display = SurfaceLeafNode['display'];

export type SurfaceId = SurfaceDocument['id'];
export type SectionId = SurfaceSectionNode['id'];
