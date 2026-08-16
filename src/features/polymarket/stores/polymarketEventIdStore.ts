import { createBaseStore } from '@storesjs/stores';

type PolymarketEventIdState = {
  eventId: string | null;
};

export const polymarketEventIdStore = createBaseStore<PolymarketEventIdState>(() => ({ eventId: null }));

/** Sets the event ID used by the Polymarket event query store. */
export function prefetchPolymarketEvent(eventId: string): void {
  polymarketEventIdStore.setState({ eventId });
}
