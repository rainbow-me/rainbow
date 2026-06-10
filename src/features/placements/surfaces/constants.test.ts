import { DISPLAYS, EVENT_CARD_DISPLAY_VALUES, isEventCardDisplay, MARKET_DISPLAY_VALUES, PREDICTION_DISPLAY_VALUES } from './constants';

describe('isEventCardDisplay', () => {
  it('returns true for prediction_event_card.carousel', () => {
    expect(isEventCardDisplay(DISPLAYS.PREDICTION_EVENT_CARD_CAROUSEL)).toBe(true);
  });

  it('returns true for prediction_event_card.list', () => {
    expect(isEventCardDisplay(DISPLAYS.PREDICTION_EVENT_CARD_LIST)).toBe(true);
  });

  it('returns false for market displays', () => {
    for (const display of MARKET_DISPLAY_VALUES) {
      expect(isEventCardDisplay(display)).toBe(false);
    }
  });

  it('returns false for non-event-card prediction displays', () => {
    const nonEventCardPredictions = PREDICTION_DISPLAY_VALUES.filter(d => !(EVENT_CARD_DISPLAY_VALUES as readonly string[]).includes(d));
    for (const display of nonEventCardPredictions) {
      expect(isEventCardDisplay(display)).toBe(false);
    }
  });

  it('returns false for arbitrary strings', () => {
    expect(isEventCardDisplay('foo.bar')).toBe(false);
    expect(isEventCardDisplay('')).toBe(false);
  });
});

describe('display set disjointness', () => {
  it('MARKET_DISPLAY_VALUES and PREDICTION_DISPLAY_VALUES are disjoint', () => {
    const market = new Set(MARKET_DISPLAY_VALUES as readonly string[]);
    for (const d of PREDICTION_DISPLAY_VALUES) {
      expect(market.has(d)).toBe(false);
    }
  });

  it('EVENT_CARD_DISPLAY_VALUES is a subset of PREDICTION_DISPLAY_VALUES', () => {
    const prediction = new Set(PREDICTION_DISPLAY_VALUES as readonly string[]);
    for (const d of EVENT_CARD_DISPLAY_VALUES) {
      expect(prediction.has(d)).toBe(true);
    }
  });
});
