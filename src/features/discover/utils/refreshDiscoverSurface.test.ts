import { refreshDiscoverSurface } from './refreshDiscoverSurface';

jest.mock('@/features/config/stores/remoteConfig', () => ({
  useRemoteConfigStore: { getState: () => ({ getRemoteConfigKey: () => mockPerpsEnabled }) },
}));
jest.mock('@/features/perps/stores/hyperliquidMarketsStore', () => ({
  useHyperliquidMarketsStore: { getState: () => ({ fetch: mockPerpsFetch }) },
}));
jest.mock('@/features/placements/stores/derived/predictionsPlacementStore', () => ({
  usePredictionEventsStore: { getState: () => mockPredictions },
}));
jest.mock('@/features/placements/stores/derived/tokensPlacementStore', () => ({
  clearTokenRefCache: () => mockClearTokenRefCache(),
  useTokenRefsStore: { getState: () => ({ fetch: mockTokensFetch }) },
}));
jest.mock('@/features/placements/stores/placementsStore', () => ({
  usePlacementsStore: { getState: () => ({ fetch: mockPlacementsFetch }) },
}));
jest.mock('@/features/placements/surfaces/stores/discoverSurfaceStore', () => ({
  useDiscoverSurfacePlacementRefs: { getState: () => mockRefs },
}));
jest.mock('@/features/placements/surfaces/stores/surfaceStore', () => ({
  getSurfaceStore: (id: string) => mockSurfaceStore(id),
}));
jest.mock('@/features/sports/data/sportsStore', () => ({
  useSportsLookupStore: { getState: () => mockSports },
}));

const mockPerpsFetch = jest.fn();
const mockTokensFetch = jest.fn();
const mockClearTokenRefCache = jest.fn();
const mockPlacementsFetch = jest.fn();
const mockSurfaceFetch = jest.fn();
const mockSurfaceStore = jest.fn().mockReturnValue({ getState: () => ({ fetch: mockSurfaceFetch }) });
const mockPredictions = { enabled: false, fetch: jest.fn() };
const mockSports = { enabled: false, fetch: jest.fn() };
let mockPerpsEnabled = false;
let mockRefs = { hyperliquid: [] as string[], rainbow: [] as string[], polymarket: [] as string[] };

beforeEach(() => {
  jest.clearAllMocks();
  mockPredictions.enabled = false;
  mockSports.enabled = false;
  mockPerpsEnabled = false;
  mockRefs = { hyperliquid: [], rainbow: [], polymarket: [] };
});

test('refreshes visible Sports lookups and generic fallbacks without static Polymarket refs', async () => {
  mockPredictions.enabled = true;
  mockSports.enabled = true;

  await refreshDiscoverSurface('discover');

  expect(mockSurfaceStore).toHaveBeenCalledWith('discover');
  expect(mockSurfaceFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockPlacementsFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockSports.fetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockPredictions.fetch).toHaveBeenCalledWith(undefined, { force: true });
});

test('leaves disabled prediction owners idle while preserving other provider refreshes', async () => {
  mockRefs = { hyperliquid: ['BTC'], rainbow: ['token'], polymarket: ['event'] };
  mockPerpsEnabled = true;

  await refreshDiscoverSurface('discover');

  expect(mockSports.fetch).not.toHaveBeenCalled();
  expect(mockPredictions.fetch).not.toHaveBeenCalled();
  expect(mockPerpsFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockClearTokenRefCache).toHaveBeenCalledTimes(1);
  expect(mockTokensFetch).toHaveBeenCalledWith(undefined, { force: true });
});
