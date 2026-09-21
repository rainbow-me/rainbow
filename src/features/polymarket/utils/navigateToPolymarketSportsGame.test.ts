import { getMarketColors, getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { resolvePolymarketCardColor } from '@/features/polymarket/utils/getPolymarketCardColor';
import { type Selection } from '@/features/sports/core/generated/sports';
import { rainbowFetch, type RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { setActiveRoute, useNavigationStore } from '@/state/navigation/navigationStore';

import { navigateToPolymarketSportsGame } from './navigateToPolymarketSportsGame';

jest.mock('@/features/polymarket/constants', () => ({ POLYMARKET_GAMMA_API_URL: 'https://gamma.test' }));
jest.mock('@/features/polymarket/leagues', () => ({ getLeague: jest.fn() }));
jest.mock('@/features/polymarket/utils/getImageColors', () => ({ getImagePrimaryColor: jest.fn() }));
jest.mock('@/features/polymarket/utils/getMarketColor', () => ({ getMarketColors: jest.fn(), getOutcomeColor: jest.fn() }));
jest.mock('@/features/polymarket/utils/getPolymarketCardColor', () => ({ resolvePolymarketCardColor: jest.fn() }));
jest.mock('@/hooks/useAccountAccentColor', () => ({ getHighContrastColor: jest.fn() }));
jest.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: jest.fn() }));
jest.mock('@/navigation/Navigation', () => ({ __esModule: true, default: { getActiveRoute: jest.fn(), navigateIfCurrent: jest.fn() } }));
jest.mock('react-native-reanimated', () => ({ makeMutable: (value: unknown) => ({ value }) }));

const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
const otherTokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063881';
const selection: Selection = { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 1 };
const fromRoute = Routes.POLYMARKET_BROWSE_EVENTS_SCREEN;
const color = { light: '#3366ff', dark: '#6699ff' };

function response(id = selection.eventId) {
  return {
    data: {
      id,
      slug: 'match',
      title: 'First vs Second',
      markets: [
        {
          id: selection.marketId,
          conditionId: 'condition',
          active: true,
          closed: false,
          archived: false,
          acceptingOrders: true,
          outcomes: '["Other","Chosen"]',
          clobTokenIds: JSON.stringify([otherTokenId, tokenId]),
        },
      ],
    },
    headers: new Headers(),
    status: 200,
  };
}

beforeEach(() => {
  setActiveRoute(fromRoute);
  jest.clearAllMocks();
  jest.mocked(rainbowFetch).mockReset().mockResolvedValue(response());
  jest.mocked(resolvePolymarketCardColor).mockReset().mockResolvedValue(color);
  jest.mocked(getMarketColors).mockReturnValue({ color, secondaryColor: undefined });
  jest.mocked(getOutcomeColor).mockReturnValue('#3366ff');
  jest.mocked(Navigation.getActiveRoute).mockReturnValue({ key: 'browse-1', name: fromRoute });
});

afterEach(() => jest.restoreAllMocks());

test('opens the primary event with full hydration and no active-market pruning', async () => {
  const source = response('980512');
  source.data.markets[0].active = false;
  jest.mocked(rainbowFetch).mockResolvedValue(source);

  await navigateToPolymarketSportsGame({ gameId: '980512', fromRoute });

  expect(rainbowFetch).toHaveBeenCalledWith('https://gamma.test/events/980512', { abortController: expect.any(AbortController) });
  expect(Navigation.navigateIfCurrent).toHaveBeenCalledWith(
    expect.any(Function),
    Routes.POLYMARKET_EVENT_SCREEN,
    expect.objectContaining({ eventId: '980512', event: expect.objectContaining({ id: '980512', color, markets: [expect.any(Object)] }) })
  );
});

test('opens the exact companion offer with its original index and full token precision', async () => {
  await navigateToPolymarketSportsGame({ gameId: '980512', selection, fromRoute });

  expect(rainbowFetch).toHaveBeenCalledWith('https://gamma.test/events/980884', { abortController: expect.any(AbortController) });
  expect(Navigation.navigateIfCurrent).toHaveBeenCalledWith(expect.any(Function), Routes.POLYMARKET_NEW_POSITION_SHEET, {
    event: expect.objectContaining({ id: '980884' }),
    market: expect.objectContaining({ id: '4322152', clobTokenIds: [otherTokenId, tokenId], outcomes: ['Other', 'Chosen'], color }),
    outcomeIndex: 1,
    outcomeColor: '#3366ff',
    fromRoute,
  });
});

test.each([
  ['market', { marketId: 'missing' }],
  ['token', { tokenId: otherTokenId }],
  ['index', { outcomeIndex: 0 }],
] as const)('rejects a changed %s before navigation can prefetch', async (_, changed) => {
  await expect(navigateToPolymarketSportsGame({ gameId: '980512', selection: { ...selection, ...changed }, fromRoute })).rejects.toThrow(
    'no longer available'
  );
  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
});

test.each([{ active: false }, { closed: true }, { archived: true }, { acceptingOrders: false }, { outcomes: '[]' }])(
  'rejects an unavailable exact market: %j',
  async changed => {
    const source = response();
    Object.assign(source.data.markets[0], changed);
    jest.mocked(rainbowFetch).mockResolvedValue(source);

    await expect(navigateToPolymarketSportsGame({ gameId: '980512', selection, fromRoute })).rejects.toThrow('no longer available');
    expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
  }
);

test('rejects a different source event before hydration', async () => {
  jest.mocked(rainbowFetch).mockResolvedValue(response('other'));
  await expect(navigateToPolymarketSportsGame({ gameId: '980512', selection, fromRoute })).rejects.toThrow('different event');
  expect(resolvePolymarketCardColor).not.toHaveBeenCalled();
  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
});

test('a newer press aborts the old request even when the fetch resolves after cancellation', async () => {
  const complete: ((value: RainbowFetchResponse<unknown>) => void)[] = [];
  jest.mocked(rainbowFetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete.push(resolve);
      })
  );
  const first = navigateToPolymarketSportsGame({ gameId: '1', fromRoute });
  const controller = jest.mocked(rainbowFetch).mock.calls[0][1].abortController;
  jest.mocked(rainbowFetch).mockResolvedValueOnce(response('2'));

  await navigateToPolymarketSportsGame({ gameId: '2', fromRoute });
  expect(controller?.signal.aborted).toBe(true);
  complete[0](response('1'));
  await first;

  expect(Navigation.navigateIfCurrent).toHaveBeenCalledTimes(1);
  expect(Navigation.navigateIfCurrent).toHaveBeenCalledWith(
    expect.any(Function),
    Routes.POLYMARKET_EVENT_SCREEN,
    expect.objectContaining({ eventId: '2' })
  );
});

test('a newer press also suppresses navigation after asynchronous event coloring', async () => {
  const complete: ((value: typeof color) => void)[] = [];
  jest.mocked(resolvePolymarketCardColor).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete.push(resolve);
      })
  );
  jest.mocked(rainbowFetch).mockResolvedValueOnce(response('1'));
  const first = navigateToPolymarketSportsGame({ gameId: '1', fromRoute });
  await Promise.resolve();
  expect(complete).toHaveLength(1);
  jest.mocked(rainbowFetch).mockResolvedValueOnce(response('2'));

  await navigateToPolymarketSportsGame({ gameId: '2', fromRoute });
  complete[0](color);
  await first;

  expect(Navigation.navigateIfCurrent).toHaveBeenCalledTimes(1);
  expect(Navigation.navigateIfCurrent).toHaveBeenCalledWith(
    expect.any(Function),
    Routes.POLYMARKET_EVENT_SCREEN,
    expect.objectContaining({ eventId: '2' })
  );
});

test('a changed route key prevents late navigation even when the route name is unchanged', async () => {
  const complete: ((value: RainbowFetchResponse<unknown>) => void)[] = [];
  jest.mocked(rainbowFetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete.push(resolve);
      })
  );
  const pending = navigateToPolymarketSportsGame({ gameId: '1', fromRoute });
  jest.mocked(Navigation.getActiveRoute).mockReturnValue({ key: 'browse-2', name: fromRoute });
  complete[0](response('1'));

  await pending;
  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
});

test('propagates a current hydration error without navigating', async () => {
  const error = new Error('Source unavailable');
  jest.mocked(rainbowFetch).mockRejectedValue(error);
  await expect(navigateToPolymarketSportsGame({ gameId: '1', fromRoute })).rejects.toBe(error);
  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
  const controller = jest.mocked(rainbowFetch).mock.calls[0][1].abortController;
  setActiveRoute(Routes.POLYMARKET_ACCOUNT_SCREEN);
  expect(controller?.signal.aborted).toBe(false);
});

test('leaving and returning to the same virtual route cannot revive an old entry', async () => {
  let finish!: (value: ReturnType<typeof response>) => void;
  jest.mocked(rainbowFetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  jest.mocked(Navigation.getActiveRoute).mockReturnValue({ key: `virtual:${fromRoute}`, name: fromRoute });
  const pending = navigateToPolymarketSportsGame({ gameId: '1', fromRoute });
  const controller = jest.mocked(rainbowFetch).mock.calls[0][1].abortController;
  const abort = jest.spyOn(AbortController.prototype, 'abort');

  setActiveRoute(Routes.POLYMARKET_ACCOUNT_SCREEN);
  expect(controller?.signal.aborted).toBe(true);
  setActiveRoute(fromRoute);
  expect(abort).toHaveBeenCalledTimes(1);
  finish(response('1'));
  await pending;

  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
});

test('source departure during event coloring aborts the entry', async () => {
  let finish!: (value: typeof color) => void;
  jest.mocked(resolvePolymarketCardColor).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const pending = navigateToPolymarketSportsGame({ gameId: selection.eventId, selection, fromRoute });
  await Promise.resolve();
  expect(finish).toBeDefined();
  const controller = jest.mocked(rainbowFetch).mock.calls[0][1].abortController;

  setActiveRoute(Routes.POLYMARKET_ACCOUNT_SCREEN);
  setActiveRoute(fromRoute);
  finish(color);
  await pending;

  expect(controller?.signal.aborted).toBe(true);
  expect(Navigation.navigateIfCurrent).not.toHaveBeenCalled();
});

test('unrelated navigation state changes do not cancel the entry, and completion releases its observer', async () => {
  const initialMounted = useNavigationStore.getState().isWalletScreenMounted;
  let finish!: (value: ReturnType<typeof response>) => void;
  jest.mocked(rainbowFetch).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const pending = navigateToPolymarketSportsGame({ gameId: '1', fromRoute });
  const controller = jest.mocked(rainbowFetch).mock.calls[0][1].abortController;

  useNavigationStore.setState({ isWalletScreenMounted: !initialMounted });
  expect(controller?.signal.aborted).toBe(false);
  finish(response('1'));
  await pending;
  expect(Navigation.navigateIfCurrent).toHaveBeenCalledTimes(1);

  setActiveRoute(Routes.POLYMARKET_ACCOUNT_SCREEN);
  expect(controller?.signal.aborted).toBe(false);
  useNavigationStore.setState({ isWalletScreenMounted: initialMounted });
});
