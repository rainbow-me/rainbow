import {
  type SectionId,
  type SurfaceDocument,
  type SurfaceId,
  type SurfaceLeafNode,
  type SurfaceNode,
} from '@/features/placements/surfaces/types';
import { type PlacementSource } from '@/features/placements/types';

export type DiscoverSurfacePlacementRefs = Record<PlacementSource, string[]>;

export type DiscoverSurface = {
  id: SurfaceId;
  tabs: DiscoverTab[];
};

export type DiscoverTab = {
  id: SectionId;
  label?: string;
  sections: SurfaceLeafNode[];
};

export type SurfaceTree = SurfaceDocument | SurfaceNode;
