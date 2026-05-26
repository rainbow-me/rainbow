import { type DESTINATION_ROOTS, type DISPLAY_VALUES } from '@/features/placements/surfaces/constants';

export type Enabled = boolean | { startsAt?: string; endsAt?: string };

export type DestinationRoot = (typeof DESTINATION_ROOTS)[keyof typeof DESTINATION_ROOTS];

export type Destination = [DestinationRoot, ...string[]] | null;

export type Display = (typeof DISPLAY_VALUES)[number];

export type SurfaceId = string;

export type SectionId = string;

export type SurfaceBase = {
  id: string;
  label?: string;
  enabled: Enabled;
  version?: number;
  updatedAt?: string;
};

export type SurfaceContainer = SurfaceBase & {
  items: Surface[];
  placement?: never;
  display?: never;
  destination?: never;
  limit?: never;
};

export type SurfaceLeaf = SurfaceBase & {
  placement?: string | null;
  display: Display;
  destination: Destination;
  limit?: number;
  items?: never;
};

export type Surface = SurfaceContainer | SurfaceLeaf;
