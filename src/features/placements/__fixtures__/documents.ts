import { PLACEMENT_SOURCES } from '@/features/placements/constants';
import { DISPLAYS } from '@/features/placements/surfaces/constants';
import { type SurfaceDocument } from '@/features/placements/surfaces/types';
import { type Placement } from '@/features/placements/types';

import discoverPlacements from './placements-v2-discover.json';
import discoverSurface from './surfaces-v1-discover.json';

export const FIXTURE_PLACEMENT_DOCUMENTS = discoverPlacements as Placement[];
export const FIXTURE_PLACEMENTS_BY_ID = Object.fromEntries(
  FIXTURE_PLACEMENT_DOCUMENTS.map(placement => [placement.id, placement])
) as Partial<Record<Placement['id'], Placement>>;

export const FIXTURE_PLACEMENT_WITHOUT_TYPE = {
  id: 'discover_perps_without_type',
  version: 2,
  source: PLACEMENT_SOURCES.HYPERLIQUID,
  items: [{ id: 'BTC' }],
};

export const FIXTURE_PLACEMENT_WITH_SCHEDULED_ITEM = {
  ...FIXTURE_PLACEMENT_DOCUMENTS[0],
  items: [
    {
      id: 'BTC',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-12-31T23:59:59.000Z',
    },
  ],
};

export const FIXTURE_DISCOVER_SURFACE_DOCUMENT = discoverSurface as SurfaceDocument;

export const FIXTURE_DISCOVER_SURFACE_WITH_INVALID_NESTED_CONTAINER = {
  ...FIXTURE_DISCOVER_SURFACE_DOCUMENT,
  items: [
    {
      id: 'for_you',
      label: 'For You',
      enabled: true,
      items: [
        FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0].items[0],
        {
          id: 'nested_container',
          label: 'Nested container',
          enabled: true,
          items: [
            {
              id: 'nested_perps',
              label: 'Nested perps',
              enabled: true,
              placement: 'nested_perps',
              display: DISPLAYS.MARKET_TILE_CAROUSEL,
              destination: ['perps'],
            },
          ],
        },
      ],
    },
  ],
};
