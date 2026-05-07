import { configure as configureDelegationClient } from '@rainbow-me/delegation';

import { createDelegationPublicClient } from './calls';
import { configureDelegationSdk } from './configureClient';

const mockGetCode = jest.fn();

jest.mock('@rainbow-me/delegation', () => ({
  configure: jest.fn(),
}));

jest.mock('@/logger', () => ({
  logger: {
    DebugContext: {
      delegation: 'delegation',
    },
    createServiceLogger: jest.fn(() => ({ debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() })),
  },
}));

jest.mock('@/resources/platform/client', () => ({
  getPlatformClient: jest.fn(() => ({ request: jest.fn() })),
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: jest.fn(),
}));

jest.mock('./calls', () => ({
  createDelegationPublicClient: jest.fn(() => ({
    getCode: mockGetCode,
  })),
}));

jest.mock('./relayService', () => ({
  relayService: { status: jest.fn() },
}));

const ACCOUNT = '0x1111111111111111111111111111111111111111';
const CHAIN_ID = 8453;

describe('configureDelegationSdk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures runtime account-code reads for stale delegation-status correction', async () => {
    mockGetCode.mockResolvedValue('0xef0100');

    configureDelegationSdk();

    const configuration = jest.mocked(configureDelegationClient).mock.calls[0][0];
    await expect(configuration.readAccountCode?.({ address: ACCOUNT, chainId: CHAIN_ID })).resolves.toBe('0xef0100');

    expect(createDelegationPublicClient).toHaveBeenCalledWith(CHAIN_ID);
    expect(mockGetCode).toHaveBeenCalledWith({ address: ACCOUNT });
  });
});
