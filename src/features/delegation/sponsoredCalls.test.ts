import { type Address } from 'viem';

import { ChainId } from '@/state/backendNetworks/types';

import { isInsufficientSponsorBalanceError, predictSponsoredCallsExecution } from './sponsoredCalls';

const mockCanUseDelegatedExecution = jest.fn<boolean, [Address]>();
const mockIsSponsorshipEligible = jest.fn<boolean, [ChainId]>();

jest.mock('./willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  backendNetworksActions: {
    isSponsorshipEligible: (chainId: ChainId) => mockIsSponsorshipEligible(chainId),
  },
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;

describe('sponsoredCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockIsSponsorshipEligible.mockReturnValue(true);
  });

  it('uses the provided sponsorship eligibility list when one is supplied', () => {
    expect(
      predictSponsoredCallsExecution({
        address: ACCOUNT,
        chainId: ChainId.base,
        sponsorshipEligibleChainIds: [],
      })
    ).toBe(false);

    expect(mockIsSponsorshipEligible).not.toHaveBeenCalled();
  });

  it('recognizes relay sponsor-capacity failures', () => {
    expect(
      isInsufficientSponsorBalanceError(
        'Managed relay execution failed: relay.link POST /execute rejected request: HTTP 400: {"error":"INSUFFICIENT_SPONSOR_BALANCE"}'
      )
    ).toBe(true);
    expect(isInsufficientSponsorBalanceError('Managed relay execution reverted')).toBe(false);
  });
});
