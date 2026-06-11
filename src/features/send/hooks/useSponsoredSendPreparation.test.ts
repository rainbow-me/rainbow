import { ChainId } from '@/state/backendNetworks/types';

import { getSponsoredSendRequestKey } from './useSponsoredSendPreparation';

jest.mock('@/model/remoteConfig', () => ({
  getRemoteConfig: () => ({ sponsored_sends_enabled: true }),
  useRemoteConfig: () => ({ sponsored_sends_enabled: true }),
}));

jest.mock('@/features/delegation/sponsoredSend', () => ({
  predictSponsoredSend: jest.fn(),
  prepareSponsoredSend: jest.fn(),
}));

jest.mock('@/features/delegation/sponsoredSendExecution', () => ({
  buildSendCallFromSendDetails: jest.fn(),
}));

const SELECTED_ASSET = {
  address: '0x5555555555555555555555555555555555555555',
  decimals: 18,
  uniqueId: 'base-eth',
};

describe('getSponsoredSendRequestKey', () => {
  it('returns null until there is a positive amount', () => {
    expect(
      getSponsoredSendRequestKey(
        {
          accountAddress: '0x3333333333333333333333333333333333333333',
          chainId: ChainId.base,
          selected: SELECTED_ASSET,
          toAddress: '0x4444444444444444444444444444444444444444',
        },
        '0'
      )
    ).toBeNull();
  });

  it('returns null for NaN amount', () => {
    expect(
      getSponsoredSendRequestKey(
        {
          accountAddress: '0x3333333333333333333333333333333333333333',
          chainId: ChainId.base,
          selected: SELECTED_ASSET,
          toAddress: '0x4444444444444444444444444444444444444444',
        },
        '.'
      )
    ).toBeNull();
  });

  it('normalizes addresses and includes asset, chain, and amount identity', () => {
    expect(
      getSponsoredSendRequestKey(
        {
          accountAddress: '0x3333333333333333333333333333333333333333'.toUpperCase(),
          chainId: ChainId.base,
          selected: SELECTED_ASSET,
          toAddress: '0x4444444444444444444444444444444444444444'.toUpperCase(),
        },
        '1.5'
      )
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

    expect(getSponsoredSendRequestKey(request, '0.999999999999999999')).not.toBe(getSponsoredSendRequestKey(request, '1'));
  });

  it('returns null for amounts that exceed asset precision', () => {
    expect(
      getSponsoredSendRequestKey(
        {
          accountAddress: '0x3333333333333333333333333333333333333333',
          chainId: ChainId.base,
          selected: SELECTED_ASSET,
          toAddress: '0x4444444444444444444444444444444444444444',
        },
        '0.9999999999999999999'
      )
    ).toBeNull();
  });

  it('separates assets with the same unique id but different token shape', () => {
    const sharedRequest = {
      accountAddress: '0x3333333333333333333333333333333333333333',
      chainId: ChainId.base,
      toAddress: '0x4444444444444444444444444444444444444444',
    };

    expect(
      getSponsoredSendRequestKey(
        {
          ...sharedRequest,
          selected: { ...SELECTED_ASSET, address: '0x5555555555555555555555555555555555555555'.toUpperCase() },
        },
        '1.5'
      )
    ).not.toBe(
      getSponsoredSendRequestKey(
        {
          ...sharedRequest,
          selected: { ...SELECTED_ASSET, address: '0x6666666666666666666666666666666666666666' },
        },
        '1.5'
      )
    );

    expect(
      getSponsoredSendRequestKey(
        {
          ...sharedRequest,
          selected: SELECTED_ASSET,
        },
        '1.5'
      )
    ).not.toBe(
      getSponsoredSendRequestKey(
        {
          ...sharedRequest,
          selected: { ...SELECTED_ASSET, decimals: 6 },
        },
        '1.5'
      )
    );
  });
});
