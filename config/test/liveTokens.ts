import { vi } from 'vitest';

vi.mock('react-native-dotenv', () => ({
  PLATFORM_BASE_URL: 'https://platform.test',
  PLATFORM_API_KEY: 'test',
  LOG_LEVEL: undefined,
  LOG_DEBUG: undefined,
}));
vi.mock('@/design-system', () => vi.importActual('@/design-system/color/palettes'));
vi.mock('@/theme/ThemeContext', () => ({}));
vi.mock('@/state/assets/userAssets', () => ({
  useUserAssetsStore: { getState: () => ({ getUserAsset: () => undefined, updateTokens: vi.fn() }) },
}));
vi.mock('@/state/liveTokens/hyperliquidPriceService', () => ({ fetchHyperliquidPrices: vi.fn() }));
vi.mock('@/features/perps/constants', () => ({ HYPERLIQUID_TOKEN_ID_SUFFIX: 'hl' }));
vi.mock('@/resources/platform/client', () => ({
  getPlatformClient: () => {
    throw new Error('These tests request Polymarket prices only');
  },
}));
