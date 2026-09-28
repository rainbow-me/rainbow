import { type RawPolymarketEvent, type RawPolymarketMarket } from '../../src/features/polymarket/types/polymarket-event';

type MarketResponse = Pick<
  RawPolymarketMarket,
  | 'id'
  | 'conditionId'
  | 'slug'
  | 'question'
  | 'icon'
  | 'active'
  | 'closed'
  | 'archived'
  | 'acceptingOrders'
  | 'outcomes'
  | 'clobTokenIds'
  | 'outcomePrices'
  | 'events'
  | 'groupItemTitle'
  | 'groupItemThreshold'
  | 'seriesColor'
  | 'negRisk'
  | 'line'
>;

type EventResponse = Pick<RawPolymarketEvent, 'id' | 'slug' | 'title' | 'image' | 'icon' | 'active' | 'closed' | 'ended'> & {
  markets: MarketResponse[];
};

/** Wire fields exercised by event admission, market processing, and order selection. */
export function predictionEvent(id: string): EventResponse {
  return {
    id,
    slug: `event-${id}`,
    title: `Event ${id}`,
    image: '',
    icon: '',
    active: true,
    closed: false,
    ended: false,
    markets: [
      {
        id: `market-${id}`,
        conditionId: `condition-${id}`,
        slug: `market-${id}`,
        question: 'Will First win?',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        acceptingOrders: true,
        outcomes: '["Yes","No"]',
        clobTokenIds: '["100","101"]',
        outcomePrices: '["0.6","0.4"]',
        events: [],
        groupItemTitle: '',
        groupItemThreshold: '0',
        seriesColor: '',
        negRisk: false,
        line: 0,
      },
    ],
  };
}
