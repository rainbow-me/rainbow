import React, { act } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { DiscoverEventPriceSubscription } from '@/features/discover/components/DiscoverEventPriceSubscription';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { useDiscoverNavigationStore } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { usePlacementsStore, type PlacementsState } from '@/features/placements/stores/placementsStore';
import { type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { type Placement } from '@/features/placements/types';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { Game } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { rainbowFetch, type RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

import {
  getPredictionPlacement,
  predictionCardEventsStore,
  predictionTileEventsStore,
  useDiscoverEventsErrorStore,
  usePredictionCardsStore,
  usePredictionEventsStore,
} from './predictionsPlacementStore';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

jest.mock('@/features/config/stores/remoteConfig', () => ({
  useRemoteConfigStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({
    getRemoteConfigKey: () => true,
  })),
}));
jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  useExperimentalConfigStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore(() => ({
    getFlag: () => false,
  })),
}));
jest.mock('@/features/placements/surfaces/stores/discoverSurfaceStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  const refs = createBaseStore<DiscoverSurfacePlacementRefs>(() => ({ hyperliquid: [], polymarket: [], rainbow: [] }));
  return { useDiscoverSurfacePlacementRefs: refs, setRefs: refs.setState };
});
jest.mock('@/features/placements/stores/placementsStore', () => ({
  usePlacementsStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore<Pick<PlacementsState, 'placementsById' | 'getPlacement'> & { getStatus: () => boolean }>((_, get) => ({
      placementsById: {},
      getPlacement: id => get().placementsById[id],
      getStatus: () => true,
    })),
}));
jest.mock('@/features/sports/data/sportsStore', () => ({
  useSportsStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ eventGameIds: {}, games: {} })),
  getGameId: (state: ReturnType<typeof useSportsStore.getState>, id: string) =>
    state.eventGameIds[id] !== undefined ? state.eventGameIds[id] : state.games[id] ? id : undefined,
  getGame: (state: ReturnType<typeof useSportsStore.getState>, id: string) => state.games[state.eventGameIds[id] ?? id],
}));
jest.mock('@/features/polymarket/constants', () => ({
  CATEGORIES: { sports: { tagId: 'sports' } },
  DEFAULT_CATEGORY_KEY: 'trending',
  POLYMARKET_GAMMA_API_URL: 'https://gamma.test',
}));
jest.mock('@/features/polymarket/utils/transforms', () => ({ processRawPolymarketEvent: jest.fn() }));
jest.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: jest.fn() }));
jest.mock('@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem', () => ({
  getPolymarketEventsListTokenIds: (event: { id: string }) => [`event:${event.id}`],
}));
jest.mock('@/navigation/RouteContext', () => ({ useRoute: () => ({ name: 'DiscoverScreen' }) }));
jest.mock('@/state/liveTokens/liveTokensStore', () => {
  const state = { setSubscription: jest.fn(), removeSubscription: jest.fn() };
  return { useLiveTokensStore: { getState: () => state } };
});
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({ getPolymarketTokenId: jest.fn((id: string) => `mid:${id}`) }));

const { setRefs } = jest.requireMock<{ setRefs: (refs: Partial<DiscoverSurfacePlacementRefs>) => void }>(
  '@/features/placements/surfaces/stores/discoverSurfaceStore'
);
const color = { dark: '#000000', light: '#ffffff' };
let unsubscribe: (() => void) | undefined;

function response<T>(data: T): RainbowFetchResponse<T> {
  return { data, headers: new Headers(), status: 200 };
}

function event(id: string) {
  return { id, title: id, markets: [{ active: true, closed: false }] };
}

function requestedIds(): string[][] {
  return jest.mocked(rainbowFetch).mock.calls.map(([url]) => new URL(String(url)).searchParams.getAll('id'));
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

beforeEach(() => {
  discoverEventListsStore.setState({ sections: {}, mountedEventIds: new Set() });
  useDiscoverNavigationStore.getState().navigate('featured');
  useDiscoverSearchQueryStore.setState({ isSearching: false });
  useSportsStore.setState({ eventGameIds: {}, games: {} });
  setRefs({ polymarket: [] });
  usePlacementsStore.setState({ placementsById: {} });
  for (const store of [predictionTileEventsStore, predictionCardEventsStore]) {
    store.setState({ queryCache: {}, lastFetchedAt: null, error: null, status: 'idle' });
  }
  jest.clearAllMocks();
  jest.mocked(rainbowFetch).mockResolvedValue(response([]));
  jest.mocked(processRawPolymarketEvent).mockImplementation(async event => ({
    ...event,
    color,
    markets: event.markets.map(market => ({
      ...market,
      clobTokenIds: [],
      outcomes: [],
      outcomePrices: [],
      events: [],
      color,
      secondaryColor: undefined,
    })),
  }));
});

afterEach(async () => {
  act(() => renderer.unmountComponentAtNode(102));
  unsubscribe?.();
  unsubscribe = undefined;
  await settle();
});

afterAll(() => {
  predictionTileEventsStore.getState().reset(true);
  predictionCardEventsStore.getState().reset(true);
});

test('requests tiles once while the displayed non-sports cards change', async () => {
  setRefs({ polymarket: ['shared', 'tile'] });
  discoverEventListsStore.getState().setList('featured', 'cards', ['sports', 'shared', 'other', 'unknown']);
  discoverEventListsStore.getState().setList('next', 'cards', ['hidden']);
  useSportsStore.setState({ eventGameIds: { sports: 'sports', shared: null, other: null, hidden: null } });
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();

  expect(requestedIds()).toEqual(expect.arrayContaining([['shared', 'tile'], ['other']]));
  expect(rainbowFetch).toHaveBeenCalledTimes(2);

  useSportsStore.setState({ eventGameIds: { sports: 'sports', shared: null, other: null, hidden: null, unrelated: null } });
  discoverEventListsStore.getState().setList('featured', 'cards', ['unknown', 'other', 'shared', 'sports']);
  await settle();
  expect(rainbowFetch).toHaveBeenCalledTimes(2);

  useDiscoverNavigationStore.getState().navigate('next');
  await settle();
  expect(requestedIds().at(-1)).toEqual(['hidden']);

  useDiscoverSearchQueryStore.setState({ isSearching: true });
  await settle();
  expect(predictionCardEventsStore.getState().enabled).toBe(false);
  expect(rainbowFetch).toHaveBeenCalledTimes(3);
});

test('discards inactive events before card processing', async () => {
  const active = event('active');
  setRefs({ polymarket: ['active', 'closed', 'ended', 'resolved', 'inactive'] });
  jest
    .mocked(rainbowFetch)
    .mockResolvedValue(
      response([
        active,
        { ...event('closed'), closed: true },
        { ...event('ended'), ended: true },
        { id: 'resolved', markets: [{ umaResolutionStatus: 'resolved' }] },
        { id: 'inactive', markets: [{ active: false }] },
      ])
    );
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();

  expect(processRawPolymarketEvent).toHaveBeenCalledTimes(1);
  const getEvent = usePredictionEventsStore.getState();
  expect(getEvent('active')?.id).toBe('active');
  for (const id of ['closed', 'ended', 'resolved', 'inactive']) expect(getEvent(id)).toBeUndefined();
});

test('keeps displayed data through request changes and failed refreshes', async () => {
  let finish: (response: RainbowFetchResponse<unknown>) => void = () => {
    throw new Error('Request did not start');
  };
  jest.mocked(rainbowFetch).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );

  setRefs({ polymarket: ['first'] });
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();
  expect(predictionTileEventsStore.getState().getStatus('isInitialLoad')).toBe(true);
  finish(response([event('first')]));
  await settle();
  const previous = predictionTileEventsStore.getState().getData();

  setRefs({ polymarket: ['first', 'missing'] });
  await settle();

  expect(predictionTileEventsStore.getState().getData()).toBe(previous);
  expect(predictionTileEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  finish(response([event('first')]));
  await settle();
  expect(predictionTileEventsStore.getState().getData()?.first?.id).toBe('first');
  expect(usePredictionEventsStore.getState()('missing')).toBeUndefined();
  expect(predictionTileEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(predictionTileEventsStore.getState().error).toBeNull();

  const displayed = predictionTileEventsStore.getState().getData();
  const error = new Error('Gamma unavailable');
  jest.mocked(rainbowFetch).mockRejectedValueOnce(error);
  await predictionTileEventsStore.getState().fetch(undefined, { force: true });

  expect(predictionTileEventsStore.getState().getData()).toBe(displayed);
  expect(predictionTileEventsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(predictionTileEventsStore.getState().error).toBe(error);
});

test('a changed card request can fail without refetching or clearing tile events', async () => {
  setRefs({ polymarket: ['tile'] });
  jest.mocked(rainbowFetch).mockResolvedValue(response([event('tile')]));
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();
  const tile = usePredictionEventsStore.getState()('tile');

  jest.mocked(rainbowFetch).mockRejectedValueOnce(new Error('Card request failed'));
  useSportsStore.setState({ eventGameIds: { card: null } });
  discoverEventListsStore.getState().setList('featured', 'cards', ['card', 'tile']);
  await settle();

  expect(requestedIds()).toEqual([['tile'], ['card']]);
  expect(useDiscoverEventsErrorStore.getState()).toEqual(new Error('Card request failed'));
  expect(usePredictionEventsStore.getState()('tile')).toBe(tile);
  expect(predictionTileEventsStore.getState().error).toBeNull();
});

test('a tile response can retire an event previously loaded for a card', async () => {
  useSportsStore.setState({ eventGameIds: { shared: null } });
  discoverEventListsStore.getState().setList('featured', 'cards', ['shared']);
  jest.mocked(rainbowFetch).mockResolvedValue(response([event('shared')]));
  unsubscribe = usePredictionEventsStore.subscribe(() => undefined);
  await settle();
  expect(usePredictionEventsStore.getState()('shared')?.id).toBe('shared');

  jest.mocked(rainbowFetch).mockResolvedValue(response([{ ...event('shared'), closed: true }]));
  setRefs({ polymarket: ['shared'] });
  await settle();

  expect(predictionCardEventsStore.getState().enabled).toBe(false);
  expect(usePredictionEventsStore.getState()('shared')).toBeUndefined();
  expect(requestedIds()).toEqual([['shared'], ['shared']]);
});

test('one price subscription follows displayed membership without reacting to scores', async () => {
  const game = Game.fromJSON({
    id: 'game',
    participants: [{ winner: { tokenId: 'win' } }],
    score: [{ kind: 'KIND_TOTAL', first: { value: 0 }, second: { value: 0 } }],
  });
  useSportsStore.setState({ games: { game }, eventGameIds: { sports: 'game', other: null, hidden: null } });
  discoverEventListsStore.getState().setList('featured', 'first', ['sports', 'other']);
  discoverEventListsStore.getState().setList('featured', 'second', ['other']);
  discoverEventListsStore.getState().setList('next', 'hidden', ['hidden']);
  jest.mocked(rainbowFetch).mockImplementation(async url => response(new URL(String(url)).searchParams.getAll('id').map(event)));

  await act(async () => {
    renderer.render(React.createElement(DiscoverEventPriceSubscription), 102, undefined, undefined);
    await settle();
  });
  const { setSubscription, removeSubscription } = useLiveTokensStore.getState();
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'DiscoverScreen', ['mid:win', 'event:other']);
  jest.mocked(setSubscription).mockClear();
  jest.mocked(getPolymarketTokenId).mockClear();

  act(() => {
    useSportsStore.setState({ games: { game: { ...game, score: [{ ...game.score[0], first: { value: 1 } }] } } });
    discoverEventListsStore.getState().removeList('featured', 'second');
  });
  expect(setSubscription).not.toHaveBeenCalled();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();

  await act(async () => {
    useDiscoverNavigationStore.getState().navigate('next');
    await settle();
  });
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'DiscoverScreen', ['event:hidden']);

  await act(async () => {
    useDiscoverSearchQueryStore.setState({ isSearching: true });
    await settle();
  });
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'DiscoverScreen', []);

  act(() => renderer.unmountComponentAtNode(102));
  expect(removeSubscription).toHaveBeenCalledTimes(1);
});

test('placement loading ends when items arrive and fetch metadata does not rerender the section', () => {
  const rendered = jest.fn();
  function Section(): null {
    rendered(usePlacementsStore(state => getPredictionPlacement(state, 'cards')));
    return null;
  }
  act(() => renderer.render(React.createElement(Section), 102, undefined, undefined));
  expect(rendered).toHaveBeenLastCalledWith(undefined);

  const placement: Placement = {
    id: 'cards',
    source: 'polymarket',
    type: 'prediction',
    version: 2,
    items: [{ id: 'b' }, { id: 'a' }],
  };
  act(() => usePlacementsStore.setState({ placementsById: { cards: placement } }));
  expect(rendered).toHaveBeenLastCalledWith(placement);
  rendered.mockClear();

  act(() => usePlacementsStore.setState({ lastFetchedAt: Date.now() }));
  expect(rendered).not.toHaveBeenCalled();
});

test('cached games render before lookup and score changes do not rerender the card projection', () => {
  const game = Game.fromJSON({ id: 'game', score: [{ kind: 'KIND_TOTAL', first: { value: 0 } }] });
  useSportsStore.setState({ games: { game }, eventGameIds: {} });
  const rendered = jest.fn();
  function Card(): null {
    rendered(usePredictionCardsStore(getCard => getCard('game')));
    return null;
  }
  act(() => renderer.render(React.createElement(Card), 102, undefined, undefined));
  expect(rendered).toHaveBeenLastCalledWith('game');
  rendered.mockClear();

  act(() => useSportsStore.setState({ games: { game: { ...game, score: [{ ...game.score[0], first: { value: 1 } }] } } }));
  expect(rendered).not.toHaveBeenCalled();
});
