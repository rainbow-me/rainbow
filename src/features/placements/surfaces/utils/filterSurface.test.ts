import { type PlacementsById } from '@/features/placements/stores/placementsStore';
import { type Surface } from '@/features/placements/surfaces/types';

import { filterSurface } from './filterSurface';

const NOW = Date.parse('2026-05-22T12:00:00.000Z');

describe('filterSurface', () => {
  it('keeps enabled containers and leaves with matching placements', () => {
    const surface = createSurface();
    const placementsById = createPlacementsById();

    expect(filterSurface(surface, placementsById, NOW)).toBe(surface);
  });

  it('drops disabled nodes, orphan placements, display/source mismatches, and empty containers', () => {
    const surface = createSurface({
      items: [
        createLeaf({ id: 'valid', placement: 'perps_top', display: 'perp_tile.carousel' }),
        createLeaf({ id: 'disabled', placement: 'perps_top', display: 'perp_tile.carousel', enabled: false }),
        createLeaf({ id: 'orphan', placement: 'missing', display: 'perp_tile.carousel' }),
        createLeaf({ id: 'mismatch', placement: 'predictions', display: 'perp_tile.carousel' }),
        createSurface({
          id: 'empty',
          items: [createLeaf({ id: 'expired_child', placement: 'perps_top', enabled: { endsAt: '2026-01-01' } })],
        }),
      ],
    });

    expect(filterSurface(surface, createPlacementsById(), NOW)).toEqual(createSurface({ items: [getSurfaceItems(surface)[0]] }));
  });

  it('evaluates scheduled enabled windows against the supplied clock', () => {
    const placementsById = createPlacementsById();
    const surface = createSurface({
      items: [
        createLeaf({
          id: 'future',
          placement: 'perps_top',
          enabled: { startsAt: '2026-05-23T00:00:00.000Z', endsAt: '2026-05-24T00:00:00.000Z' },
        }),
        createLeaf({
          id: 'active',
          placement: 'perps_top',
          enabled: { startsAt: '2026-05-21T00:00:00.000Z', endsAt: '2026-05-23T00:00:00.000Z' },
        }),
      ],
    });

    expect(filterSurface(surface, placementsById, NOW)).toEqual(createSurface({ items: [getSurfaceItems(surface)[1]] }));
    expect(filterSurface(surface, placementsById, Date.parse('2026-05-24T00:00:00.000Z'))).toBeUndefined();
  });
});

function createSurface(overrides: Partial<Surface> = {}): Surface {
  return {
    id: 'discover',
    version: 1,
    enabled: true,
    items: [createLeaf({ id: 'featured', placement: 'perps_top' })],
    ...overrides,
  } as Surface;
}

function getSurfaceItems(surface: Surface): Surface[] {
  if (!('items' in surface) || !surface.items) throw new Error('Expected surface container');
  return surface.items;
}

function createLeaf(overrides: Partial<Surface> = {}): Surface {
  return {
    id: 'featured',
    enabled: true,
    placement: 'perps_top',
    display: 'perp_tile.carousel',
    destination: ['perps'],
    ...overrides,
  } as Surface;
}

function createPlacementsById(): PlacementsById {
  return {
    perps_top: {
      id: 'perps_top',
      version: 2,
      source: 'hyperliquid',
      type: 'perp',
      items: [{ id: 'BTC' }],
    },
    predictions: {
      id: 'predictions',
      version: 2,
      source: 'polymarket',
      type: 'prediction',
      items: [{ id: '123' }],
    },
  };
}
