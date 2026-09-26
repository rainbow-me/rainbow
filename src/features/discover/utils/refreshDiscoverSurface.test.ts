import { refreshDiscoverSurface } from './refreshDiscoverSurface';

jest.mock('@/features/config/stores/remoteConfig', () => ({
  useRemoteConfigStore: { getState: () => ({ getRemoteConfigKey: () => mockPerpsEnabled }) },
}));
jest.mock('@/features/perps/stores/hyperliquidMarketsStore', () => ({
  useHyperliquidMarketsStore: { getState: () => ({ fetch: mockPerpsFetch }) },
}));
jest.mock('@/features/placements/stores/derived/predictionsPlacementStore', () => ({
  predictionTileEventsStore: { getState: () => mockTiles },
  predictionCardEventsStore: { getState: () => mockCards },
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

const mockPerpsFetch = jest.fn();
const mockTokensFetch = jest.fn();
const mockClearTokenRefCache = jest.fn();
const mockPlacementsFetch = jest.fn();
const mockSurfaceFetch = jest.fn();
const mockSurfaceStore = jest.fn().mockReturnValue({ getState: () => ({ fetch: mockSurfaceFetch }) });
const mockTiles = { enabled: false, fetch: jest.fn() };
const mockCards = { enabled: false, fetch: jest.fn() };
let mockPerpsEnabled = false;
let mockRefs: { hyperliquid: string[]; rainbow: string[]; polymarket: string[] } = { hyperliquid: [], rainbow: [], polymarket: [] };

beforeEach(() => {
  jest.clearAllMocks();
  mockTiles.enabled = false;
  mockCards.enabled = false;
  mockPerpsEnabled = false;
  mockRefs = { hyperliquid: [], rainbow: [], polymarket: [] };
});

test('refreshes Polymarket cards without tile references', async () => {
  mockCards.enabled = true;

  await refreshDiscoverSurface('discover');

  expect(mockSurfaceStore).toHaveBeenCalledWith('discover');
  expect(mockSurfaceFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockPlacementsFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockCards.fetch).toHaveBeenCalledWith(undefined, { force: true });
});

test('leaves disabled generic predictions idle while refreshing the other providers', async () => {
  mockRefs = { hyperliquid: ['BTC'], rainbow: ['token'], polymarket: ['event'] };
  mockPerpsEnabled = true;

  await refreshDiscoverSurface('discover');

  expect(mockCards.fetch).not.toHaveBeenCalled();
  expect(mockTiles.fetch).not.toHaveBeenCalled();
  expect(mockPerpsFetch).toHaveBeenCalledWith(undefined, { force: true });
  expect(mockClearTokenRefCache).toHaveBeenCalledTimes(1);
  expect(mockTokensFetch).toHaveBeenCalledWith(undefined, { force: true });
});

test('refreshes tile and card requests independently when both are enabled', async () => {
  mockCards.enabled = true;
  mockTiles.enabled = true;
  await refreshDiscoverSurface('discover');

  expect(mockCards.fetch).toHaveBeenCalledTimes(1);
  expect(mockTiles.fetch).toHaveBeenCalledTimes(1);
});
