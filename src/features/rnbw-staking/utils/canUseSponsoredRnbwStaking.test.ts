import { type Address } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { canUseSponsoredRnbwStaking } from './canUseSponsoredRnbwStaking';

const mockCanUseDelegatedExecution = vi.fn<(...args: [Address]) => boolean>();
const mockSupportsDelegatedExecution = vi.fn<(...args: [unknown]) => Promise<boolean>>();
const mockIsSponsorshipEligible = vi.fn<(...args: [ChainId]) => boolean>();

vi.mock('@/features/delegation/utils/willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
  supportsDelegatedExecution: (params: unknown) => mockSupportsDelegatedExecution(params),
}));

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: {
    isSponsorshipEligible: (chainId: ChainId) => mockIsSponsorshipEligible(chainId),
  },
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;

describe('canUseSponsoredRnbwStaking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanUseDelegatedExecution.mockReturnValue(true);
  });

  it('requires both sponsorship eligibility and delegated execution support', async () => {
    mockIsSponsorshipEligible.mockReturnValue(true);
    mockSupportsDelegatedExecution.mockResolvedValue(true);

    await expect(canUseSponsoredRnbwStaking(ACCOUNT, ChainId.base)).resolves.toBe(true);

    expect(mockSupportsDelegatedExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      chainId: ChainId.base,
    });
  });

  it('does not query delegation support when the chain cannot sponsor transactions', async () => {
    mockIsSponsorshipEligible.mockReturnValue(false);

    await expect(canUseSponsoredRnbwStaking(ACCOUNT, ChainId.mainnet)).resolves.toBe(false);

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
  });

  it('rejects sponsorship when delegation-backed execution is unsupported', async () => {
    mockIsSponsorshipEligible.mockReturnValue(true);
    mockSupportsDelegatedExecution.mockResolvedValue(false);

    await expect(canUseSponsoredRnbwStaking(ACCOUNT, ChainId.base)).resolves.toBe(false);
  });

  it('does not query chain support when local wallet facts rule out delegation', async () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);

    await expect(canUseSponsoredRnbwStaking(ACCOUNT, ChainId.base)).resolves.toBe(false);

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
  });
});
