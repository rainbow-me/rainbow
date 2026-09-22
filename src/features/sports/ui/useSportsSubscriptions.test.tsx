import React, { act, type ReactNode } from 'react';

import { Game } from '@/features/sports/core/generated/sports';
import { useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import { useSportsHost } from '@/features/sports/ui/useSportsHost';
import { useSportsLookup } from '@/features/sports/ui/useSportsLookup';
import { useSportsQuotes } from '@/features/sports/ui/useSportsQuotes';
import Routes from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const renderer = require('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev') as {
  render: (element: ReactNode, containerTag: number) => void;
  unmountComponentAtNode: (containerTag: number) => void;
};

jest.mock('@/features/sports/data/api/client', () => ({
  sportsClient: { lookupGames: jest.fn(async () => ({ games: [], resolved: [], unavailableEventIds: [] })) },
}));
jest.mock('@/features/sports/ui/sportsActivity', () => ({ syncSportsActivity: jest.fn() }));
jest.mock('@/navigation/RouteContext', () => ({ useRoute: () => ({ name: 'SportsScreen' }) }));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores').createBaseStore<{
    activeRoute: string;
    isRouteActive: (route: string) => boolean;
  }>((_, get) => ({ activeRoute: 'SportsScreen', isRouteActive: route => route === get().activeRoute })),
}));
jest.mock('@/state/liveTokens/liveTokensStore', () => {
  const state = { setSubscription: jest.fn(), removeSubscription: jest.fn() };
  return { useLiveTokensStore: { getState: () => state } };
});
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({ getPolymarketTokenId: (id: string) => `quote:${id}` }));

const route = Routes.SPORTS_SCREEN;
const setSubscription = jest.mocked(useLiveTokensStore.getState().setSubscription);
const removeSubscription = jest.mocked(useLiveTokensStore.getState().removeSubscription);
let setVisibleGames: ReturnType<typeof useSportsQuotes>;
let lookup: ReturnType<typeof useSportsLookup>;
const renderHost = jest.fn();

function Quotes({ gameIds }: { gameIds: string[] }): null {
  setVisibleGames = useSportsQuotes(gameIds);
  return null;
}

function Lookup({ eventIds, active }: { eventIds: string[]; active: boolean }): null {
  lookup = useSportsLookup(eventIds, active);
  return null;
}

function Host(): null {
  renderHost();
  useSportsHost('main');
  return null;
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise<void>(resolve => {
      setImmediate(resolve);
    });
  });
}

beforeEach(() => {
  useSportsStore.getState().clear();
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), appActive: true });
  useNavigationStore.setState({ activeRoute: route });
  useSportsStore.setState({
    games: {
      a: { ...Game.fromJSON({ id: 'a' }), quoteTokenIds: ['a'] },
      b: { ...Game.fromJSON({ id: 'b' }), quoteTokenIds: ['b'] },
    },
    eventGames: { child: 'a' },
  });
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(101));
});

afterAll(() => useSportsStore.getState().reset(true));

it('publishes committed membership, follows routes without rendering, and releases the owner on unmount', async () => {
  act(() => renderer.render(<Quotes gameIds={['a', 'b']} />, 101));
  expect(setSubscription).toHaveBeenCalledTimes(1);
  const owner = setSubscription.mock.calls[0][0];
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, []);

  setVisibleGames(['a', 'b']);
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a', 'quote:b']);

  act(() => renderer.render(<Quotes gameIds={['a']} />, 101));
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a']);
  expect(useSportsViewStore.getState().quoteConsumers.get(owner)?.visibleGameIds).toEqual(['a', 'b']);

  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, []);

  useNavigationStore.setState({ activeRoute: route });
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(owner, route, ['quote:a']);

  act(() => renderer.unmountComponentAtNode(101));
  expect(removeSubscription).toHaveBeenCalledWith(owner);
  expect(useSportsViewStore.getState().quoteConsumers.has(owner)).toBe(false);

  setSubscription.mockClear();
  setVisibleGames(['b']);
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  await settle();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('retains the lookup viewport across deactivation and removes both registrations on unmount', async () => {
  act(() => renderer.render(<Lookup eventIds={['child']} active />, 101));
  expect(setSubscription).toHaveBeenCalledTimes(1);
  lookup.setVisibleEvents(['child']);
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(lookup.owner, route, ['quote:a']);

  act(() => renderer.render(<Lookup eventIds={['child']} active={false} />, 101));
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(lookup.owner, route, []);
  expect(useSportsViewStore.getState().lookupConsumers.get(lookup.owner)?.visibleIds).toEqual(['child']);

  act(() => renderer.render(<Lookup eventIds={['child']} active />, 101));
  await settle();
  expect(setSubscription).toHaveBeenLastCalledWith(lookup.owner, route, ['quote:a']);

  act(() => renderer.unmountComponentAtNode(101));
  expect(removeSubscription).toHaveBeenCalledWith(lookup.owner);
  expect(useSportsViewStore.getState().lookupConsumers.has(lookup.owner)).toBe(false);
  setSubscription.mockClear();
  lookup.setVisibleEvents(['child']);
  await settle();
  expect(setSubscription).not.toHaveBeenCalled();
});

it('registers the current route immediately and responds to navigation without a React render', async () => {
  act(() => renderer.render(<Host />, 101));
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(true);
  expect(syncSportsActivity).toHaveBeenCalledTimes(1);

  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  await settle();
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(false);

  useNavigationStore.setState({ activeRoute: route });
  await settle();
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(true);
  expect(renderHost).toHaveBeenCalledTimes(1);

  act(() => renderer.unmountComponentAtNode(101));
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(false);
});
