import '../../../../config/test/storeEnvironment';

import React, { act } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { Game_Interruption, Game_Status, Winner_Kind, type Game } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';
import Routes from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import * as priceAdapter from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const fetchPrices = jest.spyOn(priceAdapter, 'fetchPolymarketPrices').mockResolvedValue({});
let setPrices: (gameIds: readonly string[]) => void;

function Prices(): null {
  setPrices = useSportsPriceSubscription();
  return null;
}

const game: Game = {
  id: 'game',
  competitionIds: [],
  status: Game_Status.STATUS_LIVE,
  interruption: Game_Interruption.INTERRUPTION_UNSPECIFIED,
  score: [],
  participants: [
    { id: 'first', name: 'First', winner: { eventId: 'game', marketId: 'winner', tokenId: '11', outcomeIndex: 0 } },
    { id: 'second', name: 'Second', winner: { eventId: 'game', marketId: 'winner', tokenId: '12', outcomeIndex: 1 } },
  ],
  spread: {
    eventId: 'game',
    marketId: 'spread',
    outcomes: [
      { tokenId: '13', outcomeIndex: 0, line: 1.5 },
      { tokenId: '14', outcomeIndex: 1, line: -1.5 },
    ],
  },
  winner: { kind: Winner_Kind.KIND_THREE_WAY, draw: { eventId: 'game', marketId: 'draw', tokenId: '15', outcomeIndex: 0 } },
};

beforeEach(() => {
  useAppStateStore.setState('background');
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  useSportsStore.setState({ games: { game }, lookup: undefined });
  useLiveTokensStore.setState({ tokens: {} });
});
afterEach(() => act(() => renderer.unmountComponentAtNode(101)));
afterAll(() => {
  useLiveTokensStore.getState().reset(true);
  fetchPrices.mockRestore();
});

async function expectRequestedTokens(...tokenIds: string[]): Promise<void> {
  fetchPrices.mockClear();
  await useLiveTokensStore.getState().fetch(undefined, { force: true });
  if (tokenIds.length) {
    expect(fetchPrices).toHaveBeenCalledTimes(1);
    expect(fetchPrices).toHaveBeenCalledWith(tokenIds);
  } else {
    expect(fetchPrices).not.toHaveBeenCalled();
  }
}

it('subscribes visible outcomes, follows changed tokens, and releases demand', async () => {
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
  await expectRequestedTokens(
    '11:polymarket:midpoint',
    '12:polymarket:midpoint',
    '13:polymarket:midpoint',
    '14:polymarket:midpoint',
    '15:polymarket:midpoint'
  );

  const replacement: Game = {
    id: 'next',
    competitionIds: [],
    status: Game_Status.STATUS_LIVE,
    interruption: Game_Interruption.INTERRUPTION_UNSPECIFIED,
    score: [],
    participants: [
      { id: 'first', name: 'First', winner: { eventId: 'next', marketId: 'winner', tokenId: '21', outcomeIndex: 0 } },
      { id: 'second', name: 'Second' },
    ],
  };
  act(() => useSportsStore.setState({ games: { game, next: replacement } }));
  act(() => setPrices(['next']));
  await expectRequestedTokens('21:polymarket:midpoint');

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
  await expectRequestedTokens('21:polymarket:midpoint', '22:polymarket:midpoint');

  act(() => useSportsStore.setState({ games: {} }));
  await expectRequestedTokens();
  act(() => useSportsStore.setState({ games: { next: replacement } }));
  await expectRequestedTokens('21:polymarket:midpoint');
  act(() => renderer.unmountComponentAtNode(101));
  act(() => useSportsStore.setState({ games: { next: game } }));
  await expectRequestedTokens();
});
