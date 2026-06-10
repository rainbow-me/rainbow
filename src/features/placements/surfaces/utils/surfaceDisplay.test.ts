import { DISPLAYS, MARKET_DISPLAY_VALUES, PREDICTION_DISPLAY_VALUES } from '@/features/placements/surfaces/constants';

import { isEventCardDisplay } from './surfaceDisplay';

const eventCardDisplayValues = [DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL, DISPLAYS.PREDICTION_EVENT_CARD_LIST] as const;

describe('surface display helpers', () => {
  it('keeps market and prediction display values disjoint', () => {
    const predictionDisplays = new Set<string>(PREDICTION_DISPLAY_VALUES);

    expect(MARKET_DISPLAY_VALUES.filter(display => predictionDisplays.has(display))).toEqual([]);
  });

  it('keeps event card displays inside prediction displays', () => {
    const predictionDisplays = new Set<string>(PREDICTION_DISPLAY_VALUES);

    expect(eventCardDisplayValues.every(display => predictionDisplays.has(display))).toBe(true);
  });

  it('detects event card displays', () => {
    for (const display of eventCardDisplayValues) {
      expect(isEventCardDisplay(display)).toBe(true);
    }

    expect(isEventCardDisplay(MARKET_DISPLAY_VALUES[0])).toBe(false);
    expect(isEventCardDisplay(PREDICTION_DISPLAY_VALUES[0])).toBe(false);
  });
});
