import Ajv from 'ajv';

import { FIXTURE_V2_PLACEMENTS } from '../__fixtures__/placements';
import discoverSurface from '../__fixtures__/surfaces/discover.json';
import surfaceSchema from '../surfaces/schema.v1.json';
import v1Schema from './placements-v1.schema.json';
import v2Schema from './placements-v2.schema.json';

const ajv = new Ajv({ allErrors: true });
const validateV1Placement = ajv.compile(v1Schema);
const validateV2Placement = ajv.compile(v2Schema);
const validateSurface = ajv.compile(surfaceSchema);

describe('placements v2 schema', () => {
  it('validates the v2 placement fixtures', () => {
    for (const placement of FIXTURE_V2_PLACEMENTS) {
      expect(validateV2Placement(placement)).toBe(true);
    }
  });

  it('keeps v1 and v2 placement documents mutually exclusive', () => {
    const v1Placement = createV1Placement();
    const v2Placement = FIXTURE_V2_PLACEMENTS[0];

    expect(validateV1Placement(v1Placement)).toBe(true);
    expect(validateV2Placement(v1Placement)).toBe(false);
    expect(validateV2Placement(v2Placement)).toBe(true);
    expect(validateV1Placement(v2Placement)).toBe(false);
  });

  it('rejects mismatched source/type pairs', () => {
    const placement = clonePlacement(FIXTURE_V2_PLACEMENTS[0]);
    placement.type = 'prediction';

    expect(validateV2Placement(placement)).toBe(false);
  });

  it('rejects legacy item refs', () => {
    const placement = clonePlacement(FIXTURE_V2_PLACEMENTS[0]) as unknown as { items: unknown[] };
    placement.items = [{ order: 0, ref: { id: 'BTC', source: 'hyperliquid', type: 'perp' } }];

    expect(validateV2Placement(placement)).toBe(false);
  });
});

describe('surface schema', () => {
  it('validates the Discover surface fixture', () => {
    expect(validateSurface(discoverSurface)).toBe(true);
  });

  it('requires leaf nodes to reference either a placement or nested items, but not both', () => {
    const surface = clonePlacement(discoverSurface) as any;
    surface.items[0].items[0].items = [];

    expect(validateSurface(surface)).toBe(false);
  });
});

function clonePlacement<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createV1Placement() {
  return {
    id: 'discover_featured_predictions_carousel',
    screen: 'discover',
    enabled: true,
    order: 1,
    version: 1,
    updatedAt: '2026-05-15T15:59:08.900Z',
    items: [{ order: 0, ref: { source: 'polymarket', id: 'legacy-event' } }],
  };
}
