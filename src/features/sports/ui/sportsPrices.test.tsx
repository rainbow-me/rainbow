import React, { act, type ReactElement } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { Game } from '@/features/sports/core/generated/sports';
import * as sportsStore from '@/features/sports/data/sportsStore';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

jest.mock('@/features/sports/data/api/client', () => ({ sportsClient: {} }));
jest.mock('@/navigation/RouteContext', () => ({ useRoute: () => ({ name: 'SportsScreen' }) }));
jest.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({ usePolymarketCategoryStore: {} }));
jest.mock('@/state/liveTokens/liveTokensStore', () => {
  const state = { setSubscription: jest.fn(), removeSubscription: jest.fn() };
  return { useLiveTokensStore: { getState: () => state } };
});
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({ getPolymarketTokenId: jest.fn((id: string) => `mid:${id}`) }));

const setSubscription = jest.mocked(useLiveTokensStore.getState().setSubscription);
const removeSubscription = jest.mocked(useLiveTokensStore.getState().removeSubscription);
let setPrices: (ids: readonly string[], otherTokenIds?: readonly string[]) => void;

function Prices(): null {
  setPrices = useSportsPriceSubscription();
  return null;
}

function render(element: ReactElement): void {
  act(() => renderer.render(element, 101, undefined, undefined));
}

function game(id: string, spreadTokenId?: string): Game {
  return Game.fromJSON({
    id,
    participants: [{ name: 'First', winner: { tokenId: `${id}-win` } }, { name: 'Second' }],
    spread: spreadTokenId ? { outcomes: [{ tokenId: spreadTokenId, line: 1.5 }] } : undefined,
    score: [{ kind: 'KIND_TOTAL', first: { value: 0 }, second: { value: 0 } }],
  });
}

function updateGame(id: string, update: (game: Game) => Game): void {
  act(() =>
    useSportsStore.setState(state => {
      const current = state.games[id];
      return current ? { games: { ...state.games, [id]: update(current) } } : state;
    })
  );
}

function scoreGame(current: Game): Game {
  return { ...current, score: [{ ...current.score[0], first: { value: 1 } }] };
}

beforeEach(() => {
  useSportsStore.setState({ games: { a: game('a'), b: game('b') }, eventGameIds: { child: 'a', other: null } });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  act(() => renderer.unmountComponentAtNode(101));
});

it('prices the listed Games and follows token changes', () => {
  render(<Prices />);
  act(() => setPrices(['a', 'b']));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:a-win', 'mid:b-win']);

  updateGame('b', () => game('b', 'b-spread'));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:a-win', 'mid:b-win', 'mid:b-spread']);

  act(() => setPrices(['b']));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:b-win', 'mid:b-spread']);
});

it('prices the games behind event IDs with the list’s other tokens', () => {
  render(<Prices />);
  act(() => setPrices(['child', 'other', 'unknown'], ['fallback']));

  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:a-win', 'fallback']);
});

it('formats and registers nothing for unchanged input', () => {
  render(<Prices />);
  act(() => setPrices(['a'], ['fallback']));
  const registrations = setSubscription.mock.calls.length;
  const formats = jest.mocked(getPolymarketTokenId).mock.calls.length;

  act(() => setPrices(['a'], ['fallback']));
  updateGame('a', scoreGame);
  updateGame('a', current => ({
    ...current,
    participants: current.participants.map(participant => ({ ...participant, name: 'Renamed' })),
  }));

  expect(setSubscription).toHaveBeenCalledTimes(registrations);
  expect(getPolymarketTokenId).toHaveBeenCalledTimes(formats);
});

it('does not update prices when a removed Game changes', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  updateGame('b', () => game('b', 'b-spread'));
  act(() => setPrices(['b']));
  const registrations = setSubscription.mock.calls.length;

  updateGame('a', () => game('a', 'a-spread'));
  expect(setSubscription).toHaveBeenCalledTimes(registrations);
});

it('releases prices on unmount and stops following game changes', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  act(() => renderer.unmountComponentAtNode(101));
  expect(removeSubscription).toHaveBeenCalledTimes(1);

  updateGame('a', () => game('a', 'a-spread'));
  expect(setSubscription).toHaveBeenCalledTimes(1);
});

it('does not revisit games when query metadata changes', () => {
  render(<Prices />);
  act(() => setPrices(['a', 'b']));
  const getGame = jest.spyOn(sportsStore, 'getGame');

  act(() => useSportsStore.setState({ lastFetchedAt: Date.now() }));
  expect(getGame).not.toHaveBeenCalled();
});

it('does not recheck a Game after its unchanged tokens have been compared', () => {
  const a = game('a');
  const participants = a.participants;
  const readParticipants = jest.fn(() => participants);
  Object.defineProperty(a, 'participants', { enumerable: true, get: readParticipants });
  useSportsStore.setState({ games: { a, b: game('b') } });
  render(<Prices />);
  act(() => setPrices(['a', 'b']));

  updateGame('a', scoreGame);
  readParticipants.mockClear();
  const registrations = setSubscription.mock.calls.length;
  const formats = jest.mocked(getPolymarketTokenId).mock.calls.length;

  for (let value = 1; value <= 10; value++) {
    updateGame('b', current => ({ ...current, score: [{ ...current.score[0], first: { value } }] }));
  }

  expect(readParticipants).not.toHaveBeenCalled();
  expect(setSubscription).toHaveBeenCalledTimes(registrations);
  expect(getPolymarketTokenId).toHaveBeenCalledTimes(formats);
});

it('compares equivalent ID arrays without enumerating their keys', () => {
  render(<Prices />);
  act(() => setPrices(['a'], ['fallback']));
  const registrations = setSubscription.mock.calls.length;
  const ids = ['a'];
  const otherTokenIds = ['fallback'];
  const keys = jest.spyOn(Object, 'keys');

  act(() => setPrices(ids, otherTokenIds));
  const enumeratedIds = keys.mock.calls.some(([value]) => value === ids || value === otherTokenIds);
  keys.mockRestore();

  expect(enumeratedIds).toBe(false);
  expect(setSubscription).toHaveBeenCalledTimes(registrations);
});
