import { ChainId } from '@/state/backendNetworks/types';

import { getSponsoredSendRequestKey } from './useSponsoredSendPreparation';

jest.mock('@/handlers/web3', () => ({
  buildTransaction: jest.fn(),
}));

jest.mock('@/model/remoteConfig', () => ({
  getRemoteConfig: () => ({ sponsored_sends_enabled: true }),
  useRemoteConfig: () => ({ sponsored_sends_enabled: true }),
}));

jest.mock('../../sponsoredSend', () => ({
  buildSendCall: jest.fn(),
  isPreparedSponsoredSend: jest.fn(),
  predictSponsoredSend: jest.fn(),
  prepareSponsoredSend: jest.fn(),
}));

const SELECTED_ASSET = {
  uniqueId: 'base-eth',
} satisfies Parameters<typeof getSponsoredSendRequestKey>[0]['selected'];

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

  it('normalizes addresses and includes asset, chain, and amount identity', () => {
    expect(
      getSponsoredSendRequestKey({
        accountAddress: '0x3333333333333333333333333333333333333333'.toUpperCase(),
        amount: '1.5',
        chainId: ChainId.base,
        selected: SELECTED_ASSET,
        toAddress: '0x4444444444444444444444444444444444444444'.toUpperCase(),
      })
    ).toBe('0x3333333333333333333333333333333333333333:8453:base-eth:0x4444444444444444444444444444444444444444:1.5');
  });
});
