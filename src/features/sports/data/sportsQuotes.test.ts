import { AppState } from 'react-native';

import { replaceEqualDeep } from '@tanstack/query-core';

import { Game, ScoreColumn_Kind, ScoreColumn_Winner } from '@/features/sports/core/generated/sports';
import { createSportsEventQuoteStore, createSportsQuoteStore } from '@/features/sports/data/sportsQuotes';
import { sportsActions, useSportsStore, useSportsViewStore, type SportsGame } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

jest.mock('@/features/sports/data/api/client', () => ({ sportsClient: {} }));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ activeRoute: 'SportsScreen' })),
}));
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({
  getPolymarketTokenId: jest.fn((id: string) => `quote:${id}`),
}));

const owner = Symbol('list');
const otherOwner = Symbol('otherList');
const route = Routes.SPORTS_SCREEN;
const onTokens = jest.fn();
let unsubscribe: () => void;

function game(id: string, firstToken = `${id}1`): SportsGame {
  return {
    ...Game.fromJSON({
      id,
      status: 'STATUS_LIVE',
      participants: [{ winner: { tokenId: firstToken } }, { winner: { tokenId: `${id}2` } }],
    }),
    quoteTokenIds: [firstToken, `${id}2`],
  };
}

function updateGames(...games: SportsGame[]): void {
  useSportsStore.setState(state => ({
    games: { ...state.games, ...Object.fromEntries(games.map(game => [game.id, replaceEqualDeep(state.games[game.id], game)])) },
  }));
}

async function settle(): Promise<void> {
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
}

beforeEach(() => {
  useSportsStore.getState().clear();
  AppState.currentState = 'active';
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), appActive: true });
  useNavigationStore.setState({ activeRoute: route });
  updateGames(game('a'), game('b'), game('c'));
  sportsActions.setQuoteConsumer(owner, ['a', 'b']);
  sportsActions.setVisibleQuoteGames(owner, ['a', 'b']);
  unsubscribe = createSportsQuoteStore(owner, route).subscribe(
    s => s,
    tokens => onTokens(tokens),
    { fireImmediately: true }
  );
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

it('ignores scores, unrelated offers and another list without deriving quote demand', async () => {
  updateGames(
    {
      ...game('a'),
      score: [
        { kind: ScoreColumn_Kind.KIND_TOTAL, winner: ScoreColumn_Winner.WINNER_UNSPECIFIED, first: { value: 1 }, second: { value: 0 } },
      ],
    },
    game('c', 'c3')
  );
  sportsActions.setQuoteConsumer(otherOwner, ['c']);
  sportsActions.setVisibleQuoteGames(otherOwner, ['c']);
  await settle();

  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();
});

it('delivers multiple visible offer changes together', async () => {
  updateGames(game('a', 'a3'), game('b', 'b3'));
  await settle();

  expect(onTokens).toHaveBeenCalledTimes(1);
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a3', 'quote:a2', 'quote:b3', 'quote:b2']);
});

it('changes viewport demand without discarding rendered membership and drops dependencies on hidden games', async () => {
  sportsActions.setVisibleQuoteGames(owner, ['b']);
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:b1', 'quote:b2']);
  expect(useSportsViewStore.getState().quoteConsumers.get(owner)?.renderedGameIds).toEqual(['a', 'b']);

  jest.clearAllMocks();
  sportsActions.setVisibleQuoteGames(owner, ['b']);
  updateGames(game('a', 'a3'));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();

  sportsActions.setVisibleQuoteGames(owner, ['a', 'b']);
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a3', 'quote:a2', 'quote:b1', 'quote:b2']);
});

it('removes demand for collapsed children even before the next native viewability callback', async () => {
  sportsActions.setQuoteConsumer(owner, ['a']);
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a1', 'quote:a2']);

  jest.clearAllMocks();
  updateGames(game('b', 'b3'));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();
});

it('suspends offer dependencies on route departure and resumes current demand once', async () => {
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith([]);

  jest.clearAllMocks();
  updateGames(game('a', 'a3'));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();

  useNavigationStore.setState({ activeRoute: route });
  await settle();
  expect(onTokens).toHaveBeenCalledTimes(1);
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a3', 'quote:a2', 'quote:b1', 'quote:b2']);
});

it('detaches dependencies when the final listener unsubscribes', async () => {
  unsubscribe();
  jest.clearAllMocks();

  updateGames(game('a', 'a3'));
  sportsActions.removeQuoteConsumer(owner);
  sportsActions.setVisibleQuoteGames(owner, ['b']);
  await settle();
  expect(useSportsViewStore.getState().quoteConsumers.has(owner)).toBe(false);
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();
});

function startEventQuotes(visibleIds = ['child-a']): void {
  unsubscribe();
  sportsActions.removeQuoteConsumer(owner);
  sportsActions.setLookupConsumer(owner, {
    route: Routes.DISCOVER_SCREEN,
    eventIds: ['child-a', 'child-b', 'unavailable'],
    visibleIds,
    active: true,
  });
  useSportsStore.setState({ eventGames: { 'child-a': 'a', 'child-b': 'b', 'unavailable': null } });
  unsubscribe = createSportsEventQuoteStore(owner).subscribe(
    s => s,
    tokens => onTokens(tokens),
    { fireImmediately: true }
  );
}

it('uses the lookup consumer as the only event viewport owner and follows only visible resolutions', async () => {
  startEventQuotes();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a1', 'quote:a2']);
  expect(useSportsViewStore.getState().quoteConsumers.has(owner)).toBe(false);

  jest.clearAllMocks();
  useSportsStore.setState(state => ({ eventGames: { ...state.eventGames, 'child-b': 'c' } }));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();

  sportsActions.setVisibleLookupEvents(owner, ['child-b']);
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:c1', 'quote:c2']);
  expect(useSportsStore.getState().eventGames['child-a']).toBe('a');
  expect(useSportsViewStore.getState().lookupConsumers.get(owner)?.eventIds).toEqual(['child-a', 'child-b', 'unavailable']);
});

it('keeps the observed event viewport and retained resolutions through deactivation and resumes current offers', async () => {
  startEventQuotes();
  const eventIds = ['child-a', 'child-b', 'unavailable'];
  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, active: false });
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith([]);
  expect(useSportsViewStore.getState().lookupConsumers.get(owner)?.visibleIds).toEqual(['child-a']);
  expect(useSportsStore.getState().eventGames['child-a']).toBe('a');

  jest.clearAllMocks();
  updateGames(game('a', 'a3'));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();

  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, active: true });
  await settle();
  expect(onTokens).toHaveBeenCalledTimes(1);
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a3', 'quote:a2']);
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
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  expect(onTokens).not.toHaveBeenCalled();
});

it('pauses quote demand on native activity changes without losing the observed viewport', async () => {
  sportsActions.setHostVisibility('main', true);
  syncSportsActivity();
  const onChange = jest.mocked(AppState.addEventListener).mock.calls[0][1];
  onChange('background');
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith([]);
  expect(useSportsViewStore.getState().quoteConsumers.get(owner)?.visibleGameIds).toEqual(['a', 'b']);

  jest.clearAllMocks();
  updateGames(game('a', 'a3'));
  await settle();
  expect(getPolymarketTokenId).not.toHaveBeenCalled();
  onChange('active');
  await settle();
  expect(onTokens).toHaveBeenLastCalledWith(['quote:a3', 'quote:a2', 'quote:b1', 'quote:b2']);
  sportsActions.setHostVisibility('main', false);
  syncSportsActivity();
});
