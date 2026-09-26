import React, { act, useLayoutEffect, type ReactElement } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { Game } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

jest.mock('@/features/sports/data/api/client', () => ({ sportsClient: {} }));
jest.mock('@/navigation/RouteContext', () => ({ useRoute: jest.fn(() => ({ name: 'SportsScreen' })) }));
jest.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({ usePolymarketCategoryStore: {} }));
jest.mock('@/state/liveTokens/liveTokensStore', () => {
  const state = { setSubscription: jest.fn(), removeSubscription: jest.fn() };
  return { useLiveTokensStore: { getState: () => state } };
});
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({ getPolymarketTokenId: jest.fn((id: string) => `mid:${id}`) }));

const setSubscription = jest.mocked(useLiveTokensStore.getState().setSubscription);
const removeSubscription = jest.mocked(useLiveTokensStore.getState().removeSubscription);
let setPrices: (gameIds: readonly string[]) => void;

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
  useSportsStore.setState({ games: { a: game('a'), b: game('b') }, eventGameIds: {} });
  jest.clearAllMocks();
  jest.mocked(useRoute).mockReturnValue({ key: 'sports', name: 'SportsScreen' });
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

  act(() => setPrices([]));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', []);
});

it('formats and registers nothing for unchanged input', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  const registrations = setSubscription.mock.calls.length;
  const formats = jest.mocked(getPolymarketTokenId).mock.calls.length;

  const update = setPrices;
  render(<Prices />);
  expect(setPrices).toBe(update);
  act(() => setPrices(['a']));
  updateGame('a', scoreGame);
  updateGame('a', current => ({
    ...current,
    participants: current.participants.map(participant => ({ ...participant, name: 'Renamed' })),
  }));

  expect(setSubscription).toHaveBeenCalledTimes(registrations);
  expect(getPolymarketTokenId).toHaveBeenCalledTimes(formats);
});

it('follows only the listed Games as data changes', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  updateGame('b', () => game('b', 'b-spread'));
  act(() => setPrices(['b']));
  const registrations = setSubscription.mock.calls.length;

  updateGame('a', () => game('a', 'a-spread'));
  expect(setSubscription).toHaveBeenCalledTimes(registrations);

  act(() => useSportsStore.setState({ games: {} }));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', []);

  act(() => useSportsStore.setState({ games: { b: game('b') } }));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:b-win']);
});

it('releases prices on unmount and stops following game changes', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  act(() => renderer.unmountComponentAtNode(101));
  expect(removeSubscription).toHaveBeenCalledTimes(1);

  updateGame('a', () => game('a', 'a-spread'));
  expect(setSubscription).toHaveBeenCalledTimes(1);
});

it('does not revisit Games when query metadata or event aliases change', () => {
  const games = useSportsStore.getState().games;
  const a = games.a;
  const readGame = jest.fn(() => a);
  Object.defineProperty(games, 'a', { enumerable: true, get: readGame });
  useSportsStore.setState({ eventGameIds: { a: null } });
  render(<Prices />);
  act(() => setPrices(['a', 'b']));
  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'SportsScreen', ['mid:a-win', 'mid:b-win']);
  readGame.mockClear();

  act(() => useSportsStore.setState({ lastFetchedAt: Date.now() }));
  act(() => useSportsStore.setState({ eventGameIds: { a: 'a' } }));
  expect(readGame).not.toHaveBeenCalled();
  expect(setSubscription).toHaveBeenCalledTimes(1);
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

it('restores the selected Games after the subscription route changes', () => {
  render(<Prices />);
  act(() => setPrices(['a']));
  const owner = setSubscription.mock.calls[0][0];

  jest.mocked(useRoute).mockReturnValue({ key: 'discover', name: 'DiscoverScreen' });
  render(<Prices />);

  expect(removeSubscription).toHaveBeenLastCalledWith(owner);
  expect(setSubscription).toHaveBeenLastCalledWith(owner, 'DiscoverScreen', ['mid:a-win']);
  expect(removeSubscription.mock.invocationCallOrder.at(-1)).toBeLessThan(setSubscription.mock.invocationCallOrder.at(-1) ?? 0);
});

it('restores prices after a layout update during subscription rebinding', () => {
  function LayoutUpdate({ version }: { version: number }): null {
    useLayoutEffect(() => {
      if (version) useSportsStore.setState({ games: { a: game('a', 'a-spread') } });
    }, [version]);
    return null;
  }
  const screen = (version: number) => (
    <>
      <Prices />
      <LayoutUpdate version={version} />
    </>
  );

  render(screen(0));
  act(() => setPrices(['a']));
  jest.mocked(useRoute).mockReturnValue({ key: 'discover', name: 'DiscoverScreen' });
  render(screen(1));

  expect(setSubscription).toHaveBeenLastCalledWith(expect.any(Symbol), 'DiscoverScreen', ['mid:a-win', 'mid:a-spread']);
  expect(removeSubscription.mock.invocationCallOrder.at(-1)).toBeLessThan(setSubscription.mock.invocationCallOrder.at(-1) ?? 0);
});
