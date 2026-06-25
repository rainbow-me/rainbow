import { getAddress, type Address } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';

import { getCachedDelegationSupport, getDelegationSupportRequestKey, getSponsoredSendRequestKey } from './useSponsoredSendPreparation';

jest.mock('@/features/config/stores/remoteConfig', () => ({
  getRemoteConfig: () => ({ sponsored_sends_enabled: true }),
  useRemoteConfig: () => ({ sponsored_sends_enabled: true }),
}));

jest.mock('../utils/sponsoredSend', () => ({
  predictSponsoredSend: jest.fn(),
  prepareSponsoredSend: jest.fn(),
}));

jest.mock('../utils/sponsoredSendExecution', () => ({
  buildSendCallFromSendDetails: jest.fn(),
}));

const mockSupportsDelegatedExecution = jest.fn<Promise<boolean>, [unknown]>();

jest.mock('@/features/delegation/willDelegate', () => ({
  supportsDelegatedExecution: (params: unknown) => mockSupportsDelegatedExecution(params),
}));

const ACCOUNT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' satisfies Address;
const CHECKSUM_ACCOUNT = getAddress(ACCOUNT);

const SELECTED_ASSET = {
  address: '0x5555555555555555555555555555555555555555',
  decimals: 18,
  uniqueId: 'base-eth',
};

describe('getSponsoredSendRequestKey', () => {
  it('returns null until there is a positive amount', () => {
    expect(
      getSponsoredSendRequestKey({
        accountAddress: '0x3333333333333333333333333333333333333333',
        amount: '0',
        chainId: ChainId.base,
        selected: SELECTED_ASSET,
        toAddress: '0x4444444444444444444444444444444444444444',
      })
    ).toBeNull();
  });

  it('returns null for NaN amount', () => {
    expect(
      getSponsoredSendRequestKey({
        accountAddress: '0x3333333333333333333333333333333333333333',
        amount: '.',
        chainId: ChainId.base,
        selected: SELECTED_ASSET,
        toAddress: '0x4444444444444444444444444444444444444444',
      })
    ).toBeNull();
  });

  it('normalizes addresses and includes asset, chain, and amount identity', () => {
    expect(
      getSponsoredSendRequestKey({
        accountAddress: '0x3333333333333333333333333333333333333333'.toUpperCase(),
        amount: '1.5',
        chainId: ChainId.base,
        selected: SELECTED_ASSET,
        toAddress: '0x4444444444444444444444444444444444444444'.toUpperCase(),
      })
    ).toBe(
      '0x3333333333333333333333333333333333333333:8453:base-eth:0x5555555555555555555555555555555555555555:18:0x4444444444444444444444444444444444444444:1500000000000000000'
    );
  });

  it('keys by exact raw amount rather than rounded JavaScript number identity', () => {
    const request = {
      accountAddress: '0x3333333333333333333333333333333333333333',
      chainId: ChainId.base,
      selected: SELECTED_ASSET,
      toAddress: '0x4444444444444444444444444444444444444444',
    };

    expect(getSponsoredSendRequestKey({ ...request, amount: '0.999999999999999999' })).not.toBe(
      getSponsoredSendRequestKey({ ...request, amount: '1' })
    );
  });

  it('returns null for amounts that exceed asset precision', () => {
    expect(
      getSponsoredSendRequestKey({
        accountAddress: '0x3333333333333333333333333333333333333333',
        amount: '0.9999999999999999999',
        chainId: ChainId.base,
        selected: SELECTED_ASSET,
        toAddress: '0x4444444444444444444444444444444444444444',
      })
    ).toBeNull();
  });

  it('separates assets with the same unique id but different token shape', () => {
    const sharedRequest = {
      accountAddress: '0x3333333333333333333333333333333333333333',
      amount: '1.5',
      chainId: ChainId.base,
      toAddress: '0x4444444444444444444444444444444444444444',
    };

    expect(
      getSponsoredSendRequestKey({
        ...sharedRequest,
        selected: {
          ...SELECTED_ASSET,
          address: '0x5555555555555555555555555555555555555555'.toUpperCase(),
        },
      })
    ).not.toBe(
      getSponsoredSendRequestKey({
        ...sharedRequest,
        selected: {
          ...SELECTED_ASSET,
          address: '0x6666666666666666666666666666666666666666',
        },
      })
    );

    expect(
      getSponsoredSendRequestKey({
        ...sharedRequest,
        selected: SELECTED_ASSET,
      })
    ).not.toBe(
      getSponsoredSendRequestKey({
        ...sharedRequest,
        selected: {
          ...SELECTED_ASSET,
          decimals: 6,
        },
      })
    );
  });
});

describe('getCachedDelegationSupport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes cache keys by account and chain', () => {
    expect(
      getDelegationSupportRequestKey({
        accountAddress: CHECKSUM_ACCOUNT,
        chainId: ChainId.base,
      })
    ).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:8453');
  });

  it('reuses the same delegation support request for matching account and chain', async () => {
    const cache = new Map<string, Promise<boolean>>();
    mockSupportsDelegatedExecution.mockResolvedValue(true);

    await expect(getCachedDelegationSupport({ accountAddress: ACCOUNT, cache, chainId: ChainId.base })).resolves.toBe(true);
    await expect(
      getCachedDelegationSupport({
        accountAddress: CHECKSUM_ACCOUNT,
        cache,
        chainId: ChainId.base,
      })
    ).resolves.toBe(true);

    expect(mockSupportsDelegatedExecution).toHaveBeenCalledTimes(1);
    expect(mockSupportsDelegatedExecution).toHaveBeenCalledWith({ address: ACCOUNT, chainId: ChainId.base });
  });

  it('drops failed delegation support requests so the next preparation can retry', async () => {
    const cache = new Map<string, Promise<boolean>>();
    mockSupportsDelegatedExecution.mockRejectedValueOnce(new Error('support failed')).mockResolvedValueOnce(true);

    await expect(getCachedDelegationSupport({ accountAddress: ACCOUNT, cache, chainId: ChainId.base })).rejects.toThrow('support failed');
    await expect(getCachedDelegationSupport({ accountAddress: ACCOUNT, cache, chainId: ChainId.base })).resolves.toBe(true);

    expect(mockSupportsDelegatedExecution).toHaveBeenCalledTimes(2);
  });
});
