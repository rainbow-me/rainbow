import { type SectionId, type SurfaceId, type SurfaceLeafNode } from '@/features/placements/surfaces/types';

export type DiscoverSurface = {
  id: SurfaceId;
  tabs: DiscoverTab[];
};

export type DiscoverTab = {
  id: SectionId;
  label?: string;
  sections: SurfaceLeafNode[];
};
