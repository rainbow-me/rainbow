import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type Call } from '@rainbow-me/delegation';
import { SwapType, type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { prepareCrosschainSwapCall } from './actions/crosschainSwap';
import { prepareSwapCall } from './actions/swap';
import { prepareApprovalCall } from './actions/unlock';
import { resolveApprovalRequirement } from './approval';
import { buildAtomicExecutionRequirements, prepareAtomicSwapCalls } from './atomicSwapPreparation';

const mockGetRemoteConfig = jest.fn(() => ({ sponsored_swaps_enabled: true }));

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    prepare: {
      calls: jest.fn(),
    },
  },
}));

jest.mock('@/features/config/stores/remoteConfig', () => ({
  getRemoteConfig: () => mockGetRemoteConfig(),
}));

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: {
    isSponsorshipEligible: jest.fn(),
  },
}));

jest.mock('./approval', () => ({
  resolveApprovalRequirement: jest.fn(),
}));

jest.mock('./actions/unlock', () => ({
  prepareApprovalCall: jest.fn(),
}));

jest.mock('./actions/swap', () => ({
  prepareSwapCall: jest.fn(),
}));

jest.mock('./actions/crosschainSwap', () => ({
  prepareCrosschainSwapCall: jest.fn(),
}));

// ============ Helpers ======================================================= //

function buildQuote(chainId = 8453): Quote {
  return {
    allowanceNeeded: false,
    allowanceTarget: '0x1111111111111111111111111111111111111111',
    buyAmount: '2',
    buyAmountDisplay: '2',
    buyAmountDisplayMinimum: '2',
    buyAmountInEth: '0',
    buyAmountMinusFees: '2',
    buyTokenAddress: '0x2222222222222222222222222222222222222222',
    chainId,
    data: '0x1234',
    fee: '0',
    feeInEth: '0',
    feePercentageBasisPoints: 0,
    from: '0x3333333333333333333333333333333333333333',
    sellAmount: '1',
    sellAmountDisplay: '1',
    sellAmountInEth: '0',
    sellAmountMinusFees: '1',
    sellTokenAddress: '0x4444444444444444444444444444444444444444',
    swapType: SwapType.normal,
    to: '0x5555555555555555555555555555555555555555',
    tradeAmountUSD: 1,
    tradeFeeAmountUSD: 0,
    value: '0',
  };
}

function buildCrosschainQuote(chainId = 8453): CrosschainQuote {
  return {
    ...buildQuote(chainId),
    refuel: null,
    routes: [],
    swapType: SwapType.crossChain,
  };
}

// ============ Tests ========================================================= //

describe('atomicSwapPreparation', () => {
  const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', 8453);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(backendNetworksActions.isSponsorshipEligible).mockImplementation(chainId => chainId !== 1);
    mockGetRemoteConfig.mockReturnValue({ sponsored_swaps_enabled: true });
  });

  it('builds the same-chain atomic call list without approval when none is required', async () => {
    const quote = buildQuote();
    const swapCall: Call = {
      data: '0xaaaa',
      to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      value: 0n,
    };

    jest.mocked(resolveApprovalRequirement).mockResolvedValue({
      allowanceTargetAddress: null,
      requiresApprove: false,
    });
    jest.mocked(prepareSwapCall).mockResolvedValue(swapCall);

    await expect(
      prepareAtomicSwapCalls({
        account: quote.from,
        chainId: quote.chainId,
        provider,
        quote,
      })
    ).resolves.toEqual([swapCall]);

    expect(prepareApprovalCall).not.toHaveBeenCalled();
    expect(prepareSwapCall).toHaveBeenCalledWith({ quote, provider });
  });

  it('builds approval before the bridge call when approval is required', async () => {
    const quote = buildCrosschainQuote();
    const approvalCall: Call = {
      data: '0xbbbb',
      to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      value: 0n,
    };
    const bridgeCall: Call = {
      data: '0xcccc',
      to: '0xcccccccccccccccccccccccccccccccccccccccc',
      value: 5n,
    };

    jest.mocked(resolveApprovalRequirement).mockResolvedValue({
      allowanceTargetAddress: '0x6666666666666666666666666666666666666666',
      requiresApprove: true,
    });
    jest.mocked(prepareApprovalCall).mockResolvedValue(approvalCall);
    jest.mocked(prepareCrosschainSwapCall).mockResolvedValue(bridgeCall);

    await expect(
      prepareAtomicSwapCalls({
        account: quote.from,
        chainId: quote.chainId,
        provider,
        quote,
      })
    ).resolves.toEqual([approvalCall, bridgeCall]);

    expect(prepareApprovalCall).toHaveBeenCalledWith({
      amount: quote.sellAmount.toString(),
      chainId: quote.chainId,
      owner: quote.from,
      spender: '0x6666666666666666666666666666666666666666',
      tokenAddress: quote.sellTokenAddress,
      useExactApproval: true,
    });
    expect(prepareCrosschainSwapCall).toHaveBeenCalledWith({ quote });
  });

  it('requests sponsor fees only when sponsorship is enabled and eligible', async () => {
    expect(buildAtomicExecutionRequirements(8453)).toEqual({
      atomic: 'required',
      fees: { payer: 'sponsor' },
    });

    mockGetRemoteConfig.mockReturnValue({ sponsored_swaps_enabled: false });

    expect(buildAtomicExecutionRequirements(8453)).toEqual({
      atomic: 'required',
      fees: undefined,
    });
  });
});
