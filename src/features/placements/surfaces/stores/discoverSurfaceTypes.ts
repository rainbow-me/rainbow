import {
  type SectionId,
  type SurfaceDocument,
  type SurfaceId,
  type SurfaceLeafNode,
  type SurfaceNode,
} from '@/features/placements/surfaces/types';
import { type PlacementSourceV2 } from '@/features/placements/types';

export type DiscoverSurfacePlacementRefs = Record<PlacementSourceV2, string[]>;

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
