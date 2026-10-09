import { type SectionId, type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';
import { type PlacementSource } from '@/features/placements/types';

export type DiscoverSurface = {
  id: SurfaceId;
  tabs: DiscoverTab[];
};

export type DiscoverTab = {
  id: SectionId;
  label?: string;
  sections: SurfaceLeafNode[];
};

export type DiscoverSurfacePlacementRefs = Record<PlacementSource, string[]>;
