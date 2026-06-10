import {
  FIXTURE_DISCOVER_SURFACE_DOCUMENT,
  FIXTURE_DISCOVER_SURFACE_WITH_INVALID_NESTED_CONTAINER,
  FIXTURE_PLACEMENT_DOCUMENTS,
  FIXTURE_PLACEMENT_WITH_SCHEDULED_ITEM,
  FIXTURE_PLACEMENT_WITHOUT_TYPE,
  FIXTURE_PLACEMENTS_BY_ID,
} from '../../../__fixtures__/documents';
import { placementSchema } from '../../../schema/placementContract';
import { parseSurfaceDocument } from '../../schema/surfaceContract';
import { buildSurface, filterIncompatiblePlacementSurface, filterSurface, getSurfacePlacementRefs } from './surfaceTransform';

const NOW = Date.parse('2026-06-01T00:00:00.000Z');

describe('surface transform', () => {
  const surface = parseFixtureSurface(FIXTURE_DISCOVER_SURFACE_DOCUMENT);

  it('accepts live-shaped placement and surface fixture documents', () => {
    for (const placement of FIXTURE_PLACEMENT_DOCUMENTS) {
      expect(placementSchema.safeParse(placement).success).toBe(true);
    }
  });

  it('accepts placements without a denormalized type', () => {
    expect(placementSchema.safeParse(FIXTURE_PLACEMENT_WITHOUT_TYPE).success).toBe(true);
  });

  it('strips denormalized placement type from parsed data', () => {
    expect(placementSchema.parse(FIXTURE_PLACEMENT_DOCUMENTS[0])).not.toHaveProperty('type');
  });

  it('accepts placement item schedule windows', () => {
    const parsed = placementSchema.parse(FIXTURE_PLACEMENT_WITH_SCHEDULED_ITEM);
    expect(parsed.items[0]).toEqual({
      id: 'BTC',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-12-31T23:59:59.000Z',
    });
  });

  it('ignores unknown placement fields for forward compatibility', () => {
    const parsed = placementSchema.parse({
      ...FIXTURE_PLACEMENT_DOCUMENTS[0],
      metadata: { owner: 'cms' },
      items: [{ ...FIXTURE_PLACEMENT_DOCUMENTS[0].items[0], metadata: { rank: 1 } }],
    });

    expect(parsed).toEqual({
      id: FIXTURE_PLACEMENT_DOCUMENTS[0].id,
      version: FIXTURE_PLACEMENT_DOCUMENTS[0].version,
      source: FIXTURE_PLACEMENT_DOCUMENTS[0].source,
      items: [FIXTURE_PLACEMENT_DOCUMENTS[0].items[0]],
    });
    expect(parsed).not.toHaveProperty('metadata');
    expect(parsed).not.toHaveProperty('type');
  });

  it('ignores unknown surface fields for forward compatibility', () => {
    const parsed = parseFixtureSurface({
      ...FIXTURE_DISCOVER_SURFACE_DOCUMENT,
      metadata: { owner: 'cms' },
      items: [
        {
          ...FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0],
          priority: 1,
          items: [
            {
              ...FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0].items[0],
              metadata: { rank: 1 },
            },
          ],
        },
      ],
    });

    expect(parsed).toEqual({
      ...FIXTURE_DISCOVER_SURFACE_DOCUMENT,
      items: [
        {
          ...FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0],
          items: [FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0].items[0]],
        },
      ],
    });
  });

  it('builds the rendered surface from the fixture document', () => {
    expect(buildSurface(surface)).toEqual({
      id: 'discover',
      sections: [
        {
          id: 'for_you',
          label: 'For You',
          items: FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0].items,
        },
      ],
    });
  });

  it('collects rendered fixture placement refs by source', () => {
    const surface = buildFixtureSurface();

    expect(getSurfacePlacementRefs(surface, FIXTURE_PLACEMENTS_BY_ID, NOW)).toEqual({
      hyperliquid: ['BTC', 'ETH', 'SOL'],
      polymarket: ['polymarket-event-1', 'polymarket-event-2'],
      rainbow: ['0x0000000000000000000000000000000000000000:1', '0x0000000000000000000000000000000000000001:1'],
    });
  });

  it('filters scheduled placement refs before applying section limit', () => {
    const surface = buildFixtureSurface();

    expect(
      getSurfacePlacementRefs(
        surface,
        {
          ...FIXTURE_PLACEMENTS_BY_ID,
          discover_perps: {
            ...FIXTURE_PLACEMENT_DOCUMENTS[0],
            items: [
              { id: 'BTC' },
              { id: 'ETH', startsAt: '2999-01-01T00:00:00.000Z' },
              { id: 'SOL', endsAt: '2020-01-01T00:00:00.000Z' },
              { id: 'XRP' },
            ],
          },
        },
        NOW
      ).hyperliquid
    ).toEqual(['BTC', 'XRP']);
  });

  it('rejects invalid nested containers at the surface boundary', () => {
    expect(() => parseFixtureSurface(FIXTURE_DISCOVER_SURFACE_WITH_INVALID_NESTED_CONTAINER)).toThrow();
  });

  it('filters fixture sections in the bounded surface shape', () => {
    expect(filterSurface(surface, item => 'items' in item || item.id !== 'perps')).toEqual({
      ...surface,
      items: [
        {
          id: 'for_you',
          label: 'For You',
          enabled: true,
          items: FIXTURE_DISCOVER_SURFACE_DOCUMENT.items[0].items.slice(1),
        },
      ],
    });
  });

  it('keeps unresolved placement sections while placements hydrate', () => {
    expect(filterIncompatiblePlacementSurface(surface, {})).toBe(surface);
  });
});

function parseFixtureSurface(surface: unknown) {
  return parseSurfaceDocument('discover', surface);
}

function buildFixtureSurface() {
  return buildSurface(parseFixtureSurface(FIXTURE_DISCOVER_SURFACE_DOCUMENT));
}
