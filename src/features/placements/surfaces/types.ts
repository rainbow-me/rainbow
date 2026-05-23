export type Enabled = boolean | { startsAt?: string; endsAt?: string };

export type DestinationRoot = 'perps' | 'predictions' | 'tokens' | 'dapps';

export type Destination = [DestinationRoot, ...string[]] | null;

export type Display =
  | 'perp_pill.carousel'
  | 'perp_tile.carousel'
  | 'perp_tile.grid'
  | 'perp_row.list'
  | 'prediction_tile.carousel'
  | 'prediction_tile.grid'
  | 'prediction_tile_widget.carousel'
  | 'prediction_sport_widget.carousel'
  | 'token_cell.list';

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
  placement: string;
  display: Display;
  destination: Destination;
  limit?: number;
  items?: never;
};

export type Surface = SurfaceContainer | SurfaceLeaf;
