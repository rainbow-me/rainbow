import React, { act, type ReactNode } from 'react';

import { PolymarketChart } from '@/features/charts/polymarket/components/PolymarketChart';
import { useSportsGamePress } from '@/features/polymarket/hooks/useSportsGamePress';
import { GameBoxScore } from '@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore';
import { MarketRowLoadingSkeleton } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { MarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/MarketsSection';
import { PolymarketEventScreen } from '@/features/polymarket/screens/polymarket-event-screen/PolymarketEventScreen';
import { SportsEventMarkets } from '@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets';
import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { getMarketColors } from '@/features/polymarket/utils/getMarketColor';
import { resolvePolymarketCardColor } from '@/features/polymarket/utils/getPolymarketCardColor';
import { Game } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import Routes, { type Route } from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const renderer = require('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev') as {
  render: (element: ReactNode, containerTag: number) => void;
  unmountComponentAtNode: (containerTag: number) => void;
};

let mockRoute: Route;
let mockParams: RootStackParamList[typeof Routes.POLYMARKET_EVENT_SCREEN];
let mockRetry: (() => Promise<unknown>) | undefined;
const mockText = jest.fn();
const mockScoreMount = jest.fn();

jest.mock('@react-navigation/native', () => ({ useRoute: () => ({ name: mockRoute, params: mockParams }), useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 60, bottom: 34 }) }));
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (value: unknown) => ({ value }),
  makeMutable: (value: unknown) => ({ value }),
}));
jest.mock('@/navigation/Navigation', () => ({
  __esModule: true,
  default: {
    handleAction: (route: typeof Routes.POLYMARKET_EVENT_SCREEN, params: typeof mockParams) => {
      mockRoute = route;
      mockParams = params;
      jest.requireActual('@/navigation/prefetchRegistry').prefetchRoute(route, params);
    },
  },
}));
jest.mock('@/design-system', () => ({
  Box: ({ children }: { children: ReactNode }) => children,
  Bleed: ({ children }: { children: ReactNode }) => children,
  Text: ({ children }: { children: ReactNode }) => {
    mockText(children);
    return null;
  },
  Separator: () => null,
  globalColors: { white100: '#ffffff' },
  useColorMode: () => ({ isDarkMode: true }),
}));
jest.mock('@/components/sheet/SlackSheet', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => children }));
jest.mock('@/components/animations/ButtonPressAnimation', () => ({
  ButtonPressAnimation: ({ onPress, children }: { onPress: typeof mockRetry; children: ReactNode }) => {
    mockRetry = onPress;
    return children;
  },
}));
jest.mock('@/components/easing-gradient/EasingGradient', () => ({ EasingGradient: () => null }));
jest.mock('@/components/images/ImgixImage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/worklets/colors', () => ({ getSolidColorEquivalent: () => '#111111' }));
jest.mock('@/__swaps__/utils/swaps', () => ({ getColorValueForThemeWorklet: (color?: { dark: string }) => color?.dark ?? '#ffffff' }));
jest.mock('@/features/charts/polymarket/components/PolymarketChart', () => ({ PolymarketChart: jest.fn(() => null) }));
jest.mock('@/features/charts/polymarket/components/PolymarketChartHeader', () => ({ PolymarketChartHeader: () => null }));
jest.mock('@/features/charts/polymarket/components/PolymarketTimeframeSelector', () => ({ PolymarketTimeframeSelector: () => null }));
jest.mock('@/features/charts/polymarket/stores/polymarketStore', () => ({ polymarketChartsActions: { setSelectedEventSlug: jest.fn() } }));
jest.mock('@/features/charts/polymarket/utils/getChartLineColors', () => ({ getChartLineColors: () => undefined }));
jest.mock('@/features/charts/stores/candlestickStore', () => ({}));
jest.mock('@/features/perps/stores/perpAnnotationsStore', () => ({}));
jest.mock('@/features/polymarket/stores/polymarketOrderStore', () => ({}));
jest.mock('@/features/polymarket/constants', () => ({
  POLYMARKET_GAMMA_API_URL: 'https://gamma.test',
  POLYMARKET_BACKGROUND_DARK: '#000000',
}));
jest.mock('@/features/polymarket/leagues', () => ({ getLeague: jest.fn() }));
jest.mock('@/features/polymarket/utils/sports', () => ({ fetchTeamsForEvent: jest.fn() }));
jest.mock('@/features/polymarket/utils/getImageColors', () => ({ getImagePrimaryColor: jest.fn() }));
jest.mock('@/features/polymarket/utils/getMarketColor', () => ({ getMarketColors: jest.fn() }));
jest.mock('@/features/polymarket/utils/getPolymarketCardColor', () => ({ resolvePolymarketCardColor: jest.fn() }));
jest.mock('@/hooks/useAccountAccentColor', () => ({ getHighContrastColor: jest.fn() }));
jest.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: jest.fn() }));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/AboutSection', () => ({ AboutSection: () => null }));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/components/GameBoxScore', () => ({
  GameBoxScore: jest.fn(() => {
    jest.requireActual('react').useEffect(() => {
      mockScoreMount();
    }, []);
    return null;
  }),
}));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/components/ResolvedEventHeader', () => ({
  ResolvedEventHeader: () => null,
}));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/MarketRow', () => ({ MarketRowLoadingSkeleton: jest.fn(() => null) }));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/MarketsSection', () => ({ MarketsSection: jest.fn(() => null) }));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/OpenPositionsSection', () => ({ OpenPositionsSection: () => null }));
jest.mock('@/features/polymarket/screens/polymarket-event-screen/SportsEventMarkets', () => ({ SportsEventMarkets: jest.fn(() => null) }));
jest.mock('@/features/sports/data/sportsStore', () => ({
  useSportsStore: jest.requireActual('@storesjs/stores').createBaseStore(() => ({ games: {}, eventGames: {} })),
}));
jest.mock('@/features/sports/ui/SportsImage', () => ({ SportsImage: () => null }));
jest.mock('@/features/sports/ui/useSportsLookup', () => ({ useSportsLookup: () => undefined }));

const eventId = '980512';
const source = { id: eventId, slug: 'match', title: 'First vs Second', volume: 1000, markets: [] };
const color = { light: '#3366ff', dark: '#6699ff' };
const game = Game.fromJSON({ id: eventId, participants: [{ name: 'First' }, { name: 'Second' }] });

beforeEach(async () => {
  usePolymarketEventStore.setState({ queryCache: {}, lastFetchedAt: null, status: 'idle' });
  polymarketEventIdStore.setState({ eventId: null });
  useSportsStore.setState({ games: { [eventId]: game }, eventGames: {} });
  jest.clearAllMocks();
  jest.mocked(rainbowFetch).mockReset();
  jest.mocked(resolvePolymarketCardColor).mockResolvedValue(color);
  jest.mocked(getMarketColors).mockReturnValue({ color, secondaryColor: undefined });
  mockRetry = undefined;
  await new Promise(resolve => {
    setImmediate(resolve);
  });
});

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(101));
});

let pressGame: ReturnType<typeof useSportsGamePress>;
function GamePress() {
  pressGame = useSportsGamePress();
  return null;
}

afterAll(() => usePolymarketEventStore.getState().reset(true));

async function openGame() {
  mockRoute = Routes.SPORTS_SCREEN;
  act(() => renderer.render(<GamePress />, 101));
  await act(async () => {
    pressGame(eventId);
    renderer.render(<PolymarketEventScreen />, 101);
  });
  await act(async () => {
    await new Promise(resolve => {
      setImmediate(resolve);
    });
  });
}

it('shows a retained Game before its one financial read completes, then reuses the event cache on revisit', async () => {
  let finish!: (value: { data: typeof source; status: number; headers: Headers }) => void;
  jest.mocked(rainbowFetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );

  await openGame();
  expect(GameBoxScore).toHaveBeenCalledWith({ gameId: eventId }, undefined);
  expect(MarketRowLoadingSkeleton).toHaveBeenCalled();
  expect(PolymarketChart).not.toHaveBeenCalled();
  expect(MarketsSection).not.toHaveBeenCalled();
  expect(SportsEventMarkets).not.toHaveBeenCalled();
  expect(rainbowFetch).toHaveBeenCalledTimes(1);
  expect(polymarketEventIdStore.getState().eventId).toBe(eventId);

  await act(async () => {
    finish({ data: source, status: 200, headers: new Headers() });
  });
  expect(SportsEventMarkets).toHaveBeenLastCalledWith({ event: usePolymarketEventStore.getState().getData({ eventId }) }, undefined);

  expect(mockText).toHaveBeenCalledWith(source.title);
  expect(mockScoreMount).toHaveBeenCalledTimes(1);
  act(() => renderer.unmountComponentAtNode(101));
  jest.mocked(MarketRowLoadingSkeleton).mockClear();
  await openGame();
  expect(MarketRowLoadingSkeleton).not.toHaveBeenCalled();
  expect(rainbowFetch).toHaveBeenCalledTimes(1);
  expect(PolymarketChart).not.toHaveBeenCalled();
});

it('keeps the known Game after a failed financial read and retries through the same query owner', async () => {
  jest.mocked(rainbowFetch).mockRejectedValueOnce(new Error('offline'));
  await openGame();

  expect(GameBoxScore).toHaveBeenCalledWith({ gameId: eventId }, undefined);
  expect(mockText).toHaveBeenCalledWith('Unable to load event');
  expect(mockRetry).toBeDefined();
  expect(PolymarketChart).not.toHaveBeenCalled();

  jest.mocked(rainbowFetch).mockResolvedValueOnce({ data: source, status: 200, headers: new Headers() });
  await act(async () => {
    await mockRetry?.();
  });

  expect(rainbowFetch).toHaveBeenCalledTimes(2);
  expect(SportsEventMarkets).toHaveBeenLastCalledWith({ event: usePolymarketEventStore.getState().getData({ eventId }) }, undefined);
});
