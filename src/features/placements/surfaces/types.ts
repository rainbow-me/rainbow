import { type DESTINATION_ROOTS, type DISPLAY_VALUES } from '@/features/placements/surfaces/constants';

export type Enabled = boolean | { startsAt?: string; endsAt?: string };

export type DestinationRoot = (typeof DESTINATION_ROOTS)[keyof typeof DESTINATION_ROOTS];

export type Destination = [DestinationRoot, ...string[]] | null;

export type Display = (typeof DISPLAY_VALUES)[number];

export type SurfaceFilterValue = string | string[];

export type SurfaceFilters = Record<string, Record<string, SurfaceFilterValue>>;

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
  filters?: SurfaceFilters;
  limit?: number;
};

export type SurfaceNode = SurfaceContainerNode | SurfaceLeafNode;

export type SurfaceBase = SurfaceNodeBase;
export type SurfaceContainer = SurfaceContainerNode;
export type SurfaceLeaf = SurfaceLeafNode;
export type Surface = SurfaceNode;
