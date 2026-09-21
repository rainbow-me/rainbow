import { AppState } from 'react-native';

import { Game, ScoreColumn_Kind, ScoreColumn_Winner } from '@/features/sports/core/generated/sports';
import { subscribeToSportsEventQuotes, subscribeToSportsQuotes } from '@/features/sports/data/sportsQuotes';
import { sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import Routes from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

jest.mock('@/features/sports/data/api/client', () => ({ sportsClient: {} }));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ activeRoute: 'SportsScreen' })),
}));
jest.mock('@/state/liveTokens/liveTokensStore', () => {
  const state = { setSubscription: jest.fn(), removeSubscription: jest.fn() };
  return { useLiveTokensStore: { getState: () => state } };
});
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({
  getPolymarketTokenId: jest.fn((id: string) => `quote:${id}`),
}));

const owner = Symbol('list');
const otherOwner = Symbol('otherList');
const route = Routes.SPORTS_SCREEN;
const firstGame = Game.fromJSON({ id: 'a', participants: [{ winner: { tokenId: 'a1' } }, { winner: { tokenId: 'a2' } }] });
const readTokens = jest.fn();
const setSubscription = jest.mocked(useLiveTokensStore.getState().setSubscription);
const removeSubscription = jest.mocked(useLiveTokensStore.getState().removeSubscription);
let unsubscribe: () => void;

function tokens(...ids: string[]): string[] {
  return new Proxy(ids, {
    get(target, property, receiver) {
      if (typeof property === 'string' && /^\d+$/.test(property)) readTokens();
      return Reflect.get(target, property, receiver);
    },
  });
}

async function settle() {
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
}

beforeEach(() => {
  useSportsStore.getState().clear();
  AppState.currentState = 'active';
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), appActive: true });
  useSportsStore.setState({ quoteTokens: { a: tokens('a1', 'a2'), b: tokens('b1'), c: tokens('c1') } });
  sportsActions.setQuoteConsumer(owner, { active: true, renderedGameIds: ['a', 'b'] });
  sportsActions.setVisibleQuoteGames(owner, ['a', 'b']);
  unsubscribe = subscribeToSportsQuotes(owner, route);
  jest.clearAllMocks();
});

afterEach(() => {
  unsubscribe();
  sportsActions.removeQuoteConsumer(owner);
  sportsActions.removeQuoteConsumer(otherOwner);
  sportsActions.removeLookupConsumer(owner);
  syncSportsActivity();
});
afterAll(() => useSportsStore.getState().reset(true));

it('does not read token arrays or publish demand for scores, unrelated offers, or another consumer', async () => {
  for (let score = 0; score < 100; score++) {
    useSportsStore.setState({
      games: {
        a: {
          ...firstGame,
          score: [
            {
              kind: ScoreColumn_Kind.KIND_TOTAL,
              winner: ScoreColumn_Winner.WINNER_UNSPECIFIED,
              first: { value: score },
              second: { value: 0 },
            },
          ],
        },
      },
    });
  }
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, c: tokens('c2') } }));
  sportsActions.setQuoteConsumer(otherOwner, { active: true, renderedGameIds: ['c'] });
  sportsActions.setVisibleQuoteGames(otherOwner, ['c']);
  await settle();

  expect(readTokens).not.toHaveBeenCalled();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('delivers multiple visible offer changes once, without rebuilding subscriptions per game', async () => {
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3'), b: tokens('b2') } }));
  await settle();

  expect(readTokens).toHaveBeenCalledTimes(2);
  expect(getPolymarketTokenId).toHaveBeenCalledTimes(2);
  expect(setSubscription).toHaveBeenCalledTimes(1);
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a3', 'quote:b2']);
});

it('changes viewport demand without discarding rendered membership and drops dependencies on hidden games', async () => {
  sportsActions.setVisibleQuoteGames(owner, ['b']);
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:b1']);
  expect(useSportsViewStore.getState().quoteConsumers.get(owner)?.renderedGameIds).toEqual(['a', 'b']);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3') } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();

  sportsActions.setVisibleQuoteGames(owner, ['a', 'b']);
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a3', 'quote:b1']);
});

it('removes demand for collapsed children even before the next native viewability callback', async () => {
  sportsActions.setQuoteConsumer(owner, { active: true, renderedGameIds: ['a'] });
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a1', 'quote:a2']);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, b: tokens('b2') } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('suspends offer dependencies while inactive and resumes current demand once', async () => {
  sportsActions.setQuoteConsumer(owner, { active: false, renderedGameIds: ['a', 'b'] });
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, []);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3') } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();

  sportsActions.setQuoteConsumer(owner, { active: true, renderedGameIds: ['a', 'b'] });
  await settle();
  expect(setSubscription).toHaveBeenCalledTimes(1);
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a3', 'quote:b1']);
});

it('releases the live subscription and dependencies on unmount', async () => {
  unsubscribe();
  expect(removeSubscription).toHaveBeenCalledWith(owner);
  jest.clearAllMocks();

  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3') } }));
  sportsActions.setVisibleQuoteGames(owner, ['b']);
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();
});

function startEventQuotes(visibleIds = ['child-a']) {
  unsubscribe();
  sportsActions.removeQuoteConsumer(owner);
  sportsActions.setLookupConsumer(owner, {
    route: Routes.DISCOVER_SCREEN,
    eventIds: ['child-a', 'child-b', 'unavailable'],
    visibleIds,
    active: true,
  });
  useSportsStore.setState({ eventGames: { 'child-a': 'a', 'child-b': 'b', 'unavailable': null } });
  unsubscribe = subscribeToSportsEventQuotes(owner, Routes.DISCOVER_SCREEN);
}

it('uses the lookup consumer as the only event viewport owner and follows only visible resolutions', async () => {
  startEventQuotes();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, Routes.DISCOVER_SCREEN, ['quote:a1', 'quote:a2']);
  expect(useSportsViewStore.getState().quoteConsumers.has(owner)).toBe(false);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ eventGames: { ...state.eventGames, 'child-b': 'c' } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();

  sportsActions.setVisibleLookupEvents(owner, ['child-b']);
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, Routes.DISCOVER_SCREEN, ['quote:c1']);
  expect(useSportsStore.getState().eventGames['child-a']).toBe('a');
  expect(useSportsViewStore.getState().lookupConsumers.get(owner)?.eventIds).toEqual(['child-a', 'child-b', 'unavailable']);
});

it('keeps the observed event viewport and retained resolutions through deactivation and resumes current offers', async () => {
  startEventQuotes();
  const eventIds = ['child-a', 'child-b', 'unavailable'];
  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, active: false });
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, Routes.DISCOVER_SCREEN, []);
  expect(useSportsViewStore.getState().lookupConsumers.get(owner)?.visibleIds).toEqual(['child-a']);
  expect(useSportsStore.getState().eventGames['child-a']).toBe('a');

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3') } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();

  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, active: true });
  await settle();
  expect(setSubscription).toHaveBeenCalledTimes(1);
  expect(setSubscription).toHaveBeenLastCalledWith(owner, Routes.DISCOVER_SCREEN, ['quote:a3']);
});

it('does not publish a new quote request when a visible event resolves as unavailable', async () => {
  startEventQuotes(['unresolved']);
  sportsActions.setLookupConsumer(owner, {
    route: Routes.DISCOVER_SCREEN,
    eventIds: ['child-a', 'child-b', 'unavailable', 'unresolved'],
    active: true,
  });
  await settle();
  jest.clearAllMocks();

  useSportsStore.setState(state => ({ eventGames: { ...state.eventGames, unresolved: null } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('does not recreate a removed quote owner from a late carousel visibility callback', () => {
  sportsActions.removeQuoteConsumer(owner);
  sportsActions.setVisibleQuoteGames(owner, []);
  expect(useSportsViewStore.getState().quoteConsumers.has(owner)).toBe(false);
});

it('does not rebuild demand when native viewability repeats the same IDs', async () => {
  sportsActions.setVisibleQuoteGames(owner, ['a', 'b']);
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('pauses quote demand on native activity changes without losing the observed viewport', async () => {
  sportsActions.setHostVisibility('main', true);
  syncSportsActivity();
  const onChange = jest.mocked(AppState.addEventListener).mock.calls[0][1];
  onChange('background');
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, []);
  expect(useSportsViewStore.getState().quoteConsumers.get(owner)?.visibleGameIds).toEqual(['a', 'b']);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ quoteTokens: { ...state.quoteTokens, a: tokens('a3') } }));
  await settle();
  expect(readTokens).not.toHaveBeenCalled();
  onChange('active');
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a3', 'quote:b1']);
  sportsActions.releaseHost('main');
  syncSportsActivity();
});
