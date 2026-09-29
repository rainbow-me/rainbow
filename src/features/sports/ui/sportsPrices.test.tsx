import '../../../../config/test/storeEnvironment';

import React, { act } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { Game, Winner_Kind } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
import Routes from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
let setPrices: (gameIds: readonly string[]) => void;

function Prices(): null {
  setPrices = useSportsPriceSubscription();
  return null;
}

const game = Game.fromJSON({
  id: 'game',
  participants: [
    { name: 'First', winner: { tokenId: '11' } },
    { name: 'Second', winner: { tokenId: '12' } },
  ],
  spread: {
    outcomes: [
      { tokenId: '13', line: 1.5 },
      { tokenId: '14', line: -1.5 },
    ],
  },
  winner: { kind: Winner_Kind.KIND_THREE_WAY, draw: { tokenId: '15' } },
});

beforeEach(() => {
  useSportsStore.setState({ games: { game }, eventGameIds: {} });
  useLiveTokensStore.getState().clear();
});
afterEach(() => act(() => renderer.unmountComponentAtNode(101)));

it('subscribes visible outcomes, follows changed tokens, and releases demand', () => {
  act(() =>
    renderer.render(
      <NavigationRouteContext.Provider value={{ key: 'sports', name: Routes.SPORTS_SCREEN }}>
        <Prices />
      </NavigationRouteContext.Provider>,
      101,
      undefined,
      undefined
    )
  );
  act(() => setPrices(['game']));
  expect([...useLiveTokensStore.getState().subscriptions.values()]).toEqual([
    {
      route: Routes.SPORTS_SCREEN,
      tokenIds: [
        '11:polymarket:midpoint',
        '12:polymarket:midpoint',
        '13:polymarket:midpoint',
        '14:polymarket:midpoint',
        '15:polymarket:midpoint',
      ],
    },
  ]);

  const replacement = Game.fromJSON({ id: 'next', participants: [{ winner: { tokenId: '21' } }] });
  act(() => useSportsStore.setState({ games: { game, next: replacement } }));
  act(() => setPrices(['next']));
  expect([...useLiveTokensStore.getState().subscriptions.values()]).toEqual([
    {
      route: Routes.SPORTS_SCREEN,
      tokenIds: ['21:polymarket:midpoint'],
    },
  ]);

  act(() =>
    useSportsStore.setState({
      games: {
        next: {
          ...replacement,
          winner: { kind: Winner_Kind.KIND_THREE_WAY, draw: { eventId: 'next', marketId: 'draw', tokenId: '22', outcomeIndex: 0 } },
        },
      },
    })
  );
  expect([...useLiveTokensStore.getState().subscriptions.values()]).toEqual([
    {
      route: Routes.SPORTS_SCREEN,
      tokenIds: ['21:polymarket:midpoint', '22:polymarket:midpoint'],
    },
  ]);

  act(() => useSportsStore.setState({ games: {} }));
  expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
  act(() => useSportsStore.setState({ games: { next: replacement } }));
  expect([...useLiveTokensStore.getState().subscriptions.values()]).toEqual([
    {
      route: Routes.SPORTS_SCREEN,
      tokenIds: ['21:polymarket:midpoint'],
    },
  ]);
  act(() => renderer.unmountComponentAtNode(101));
  act(() => useSportsStore.setState({ games: { next: game } }));
  expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
});
