import { EthereumWalletType } from '@/helpers/walletTypes';
import { logger } from '@/logger';

import { getHiddenTokenIds, getShowcaseTokenIds } from './tokenPreferences';

const mockGetPreference = jest.fn();
const mockGetWalletWithAccount = jest.fn();
const mockIsDataComplete = jest.fn();
const mockMigrateTokens = jest.fn();
const mockSetCollectionOpen = jest.fn();
const mockUpdateWebHidden = jest.fn();
const mockUpdateWebShowcase = jest.fn();

jest.mock('@/helpers/webData', () => ({
  updateWebHidden: (...args: unknown[]) => mockUpdateWebHidden(...args),
  updateWebShowcase: (...args: unknown[]) => mockUpdateWebShowcase(...args),
}));

jest.mock('@/model/preferences', () => ({
  getPreference: (...args: unknown[]) => mockGetPreference(...args),
}));

jest.mock('@/logger', () => ({
  logger: { error: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/react-query', () => ({
  queryClient: { fetchQuery: jest.fn() },
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  getWalletWithAccount: (...args: unknown[]) => mockGetWalletWithAccount(...args),
}));

jest.mock('./openCollectionsStore', () => ({
  useOpenCollectionsStore: {
    getState: () => ({ setCollectionOpen: mockSetCollectionOpen }),
  },
}));

jest.mock('./utils', () => ({
  isDataComplete: (...args: unknown[]) => mockIsDataComplete(...args),
  migrateTokens: (...args: unknown[]) => mockMigrateTokens(...args),
}));

const mockLoggerError = jest.mocked(logger.error);

describe('token preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWalletWithAccount.mockReturnValue({ type: EthereumWalletType.mnemonic });
  });

  it('normalizes complete token IDs without migrating them', async () => {
    mockGetPreference.mockResolvedValue({ hidden: { ids: ['MAINNET_0xABC_1'] } });
    mockIsDataComplete.mockReturnValue(true);

    await expect(getHiddenTokenIds('0x123')).resolves.toEqual(['mainnet_0xabc_1']);
    expect(mockMigrateTokens).not.toHaveBeenCalled();
    expect(mockUpdateWebHidden).not.toHaveBeenCalled();
  });

  it('migrates incomplete showcase IDs and opens the showcase collection', async () => {
    mockGetPreference.mockResolvedValue({ showcase: { ids: ['rainbow.eth'] } });
    mockIsDataComplete.mockReturnValue(false);
    mockMigrateTokens.mockResolvedValue(['mainnet_0xabc_1']);

    await expect(getShowcaseTokenIds('0x123')).resolves.toEqual(['mainnet_0xabc_1']);
    expect(mockUpdateWebShowcase).toHaveBeenCalledWith('0x123', ['mainnet_0xabc_1']);
    expect(mockSetCollectionOpen).toHaveBeenCalledWith('showcase', true);
  });

  it('preserves incomplete IDs when migration cannot resolve them', async () => {
    mockGetPreference.mockResolvedValue({ hidden: { ids: ['missing.eth'] } });
    mockIsDataComplete.mockReturnValue(false);
    mockMigrateTokens.mockResolvedValue(null);

    await expect(getHiddenTokenIds('0x123')).resolves.toEqual(['missing.eth']);
    expect(mockUpdateWebHidden).not.toHaveBeenCalled();
  });

  it('preserves incomplete IDs when migration fails', async () => {
    mockGetPreference.mockResolvedValue({ hidden: { ids: ['rainbow.eth'] } });
    mockIsDataComplete.mockReturnValue(false);
    mockMigrateTokens.mockRejectedValue(new Error('Migration failed'));

    await expect(getHiddenTokenIds('0x123')).resolves.toEqual(['rainbow.eth']);
    expect(mockUpdateWebHidden).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to migrate NFT token preferences' }), {
      category: 'hidden',
    });
  });

  it('does not migrate preferences for read-only wallets', async () => {
    mockGetPreference.mockResolvedValue({ hidden: { ids: ['rainbow.eth'] } });
    mockIsDataComplete.mockReturnValue(false);
    mockGetWalletWithAccount.mockReturnValue({ type: EthereumWalletType.readOnly });

    await expect(getHiddenTokenIds('0x123')).resolves.toEqual([]);
    expect(mockMigrateTokens).not.toHaveBeenCalled();
    expect(mockUpdateWebHidden).not.toHaveBeenCalled();
  });
});
