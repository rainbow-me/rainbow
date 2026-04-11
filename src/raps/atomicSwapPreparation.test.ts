import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';

import { execute, type Call } from '@rainbow-me/delegation';
import { SwapType, type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { prepareCrosschainSwapCall } from './actions/crosschainSwap';
import { prepareSwapCall } from './actions/swap';
import { prepareApprovalCall } from './actions/unlock';
import { resolveApprovalRequirement } from './approval';
import { prepareAtomicSwapExecution } from './atomicSwapPreparation';

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    prepare: {
      calls: jest.fn(),
    },
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

function buildQuote(): Quote {
  return {
    allowanceNeeded: false,
    allowanceTarget: '0x1111111111111111111111111111111111111111',
    buyAmount: '2',
    buyAmountDisplay: '2',
    buyAmountDisplayMinimum: '2',
    buyAmountInEth: '0',
    buyAmountMinusFees: '2',
    buyTokenAddress: '0x2222222222222222222222222222222222222222',
    chainId: 8453,
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

function buildCrosschainQuote(): CrosschainQuote {
  return {
    ...buildQuote(),
    refuel: null,
    routes: [],
    swapType: SwapType.crossChain,
  };
}

function buildSigner(provider: StaticJsonRpcProvider): Wallet {
  return Wallet.createRandom().connect(provider);
}

// ============ Tests ========================================================= //

describe('atomicSwapPreparation', () => {
  const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', 8453);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prepares a sponsored same-chain atomic plan without approval when none is required', async () => {
    const quote = buildQuote();
    const signer = buildSigner(provider);
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
    jest.mocked(execute.prepare.calls).mockRejectedValue(new Error('prepare failed'));

    await expect(
      prepareAtomicSwapExecution({
        chainId: quote.chainId,
        provider,
        quote,
        signer,
      })
    ).rejects.toThrow('prepare failed');

    expect(prepareApprovalCall).not.toHaveBeenCalled();
    expect(prepareSwapCall).toHaveBeenCalledWith({ quote, provider });
    expect(execute.prepare.calls).toHaveBeenCalledWith({
      signer,
      provider,
      chainId: quote.chainId,
      calls: [swapCall],
      requirements: {
        atomic: 'required',
        fees: { payer: 'sponsor' },
      },
    });
  });

  it('includes approval before the bridge call when approval is required', async () => {
    const quote = buildCrosschainQuote();
    const signer = buildSigner(provider);
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
    jest.mocked(execute.prepare.calls).mockRejectedValue(new Error('prepare failed'));

    await expect(
      prepareAtomicSwapExecution({
        chainId: quote.chainId,
        provider,
        quote,
        signer,
      })
    ).rejects.toThrow('prepare failed');

    expect(prepareApprovalCall).toHaveBeenCalledWith({
      amount: quote.sellAmount.toString(),
      chainId: quote.chainId,
      owner: quote.from,
      spender: '0x6666666666666666666666666666666666666666',
      tokenAddress: quote.sellTokenAddress,
      useExactApproval: true,
    });
    expect(prepareCrosschainSwapCall).toHaveBeenCalledWith({ quote });
    expect(execute.prepare.calls).toHaveBeenCalledWith(
      expect.objectContaining({
        calls: [approvalCall, bridgeCall],
      })
    );
  });
});
