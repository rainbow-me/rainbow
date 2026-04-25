import { type Address } from 'viem';

import { ChainId } from '@/state/backendNetworks/types';

import { predictSponsoredCallsExecution } from './sponsoredCalls';

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

describe('predictSponsoredCallsExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockIsSponsorshipEligible.mockReturnValue(true);
  });

  it('requires a delegation-capable wallet', () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);

    expect(predictSponsoredCallsExecution({ address: ACCOUNT, chainId: ChainId.base })).toBe(false);

    expect(mockIsSponsorshipEligible).not.toHaveBeenCalled();
  });

  it('requires sponsorship eligibility when the chain is known', () => {
    mockIsSponsorshipEligible.mockReturnValue(false);

    expect(predictSponsoredCallsExecution({ address: ACCOUNT, chainId: ChainId.mainnet })).toBe(false);
  });

  it('allows sponsorship prediction when the known chain is eligible', () => {
    expect(predictSponsoredCallsExecution({ address: ACCOUNT, chainId: ChainId.base })).toBe(true);
  });

  it('allows explicit prediction before the chain is known', () => {
    expect(predictSponsoredCallsExecution({ address: ACCOUNT, chainId: null })).toBe(true);

    expect(mockIsSponsorshipEligible).not.toHaveBeenCalled();
  });
});
