import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { ChainId } from '@/state/backendNetworks/types';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { SwapType, type Quote } from '@rainbow-me/swaps';

import { prepareSponsoredDepositExecution } from './prepareSponsoredDepositExecution';

const mockCreateDelegationPublicClient = jest.fn<unknown, [ChainId]>();
const mockPredictSponsoredCallsExecution = jest.fn<boolean, [unknown]>();
const mockPrepareAtomicSwapCalls = jest.fn<Promise<Call[]>, [unknown]>();
const mockPrepareCalls = jest.fn<Promise<PreparedCallsExecution>, [unknown]>();
const mockSupportsDelegatedExecution = jest.fn<Promise<boolean>, [unknown]>();

const mockSponsoredCallsRequirements = {
  atomic: 'required',
  fees: { payer: 'sponsor' },
};

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
}));

jest.mock('@/features/delegation/calls', () => ({
  createDelegationPublicClient: (chainId: ChainId) => mockCreateDelegationPublicClient(chainId),
  SPONSORED_CALLS_REQUIREMENTS: {
    atomic: 'required',
    fees: { payer: 'sponsor' },
  },
}));

jest.mock('@/features/delegation/sponsoredCalls', () => ({
  predictSponsoredCallsExecution: (params: unknown) => mockPredictSponsoredCallsExecution(params),
}));

jest.mock('@/features/delegation/willDelegate', () => ({
  supportsDelegatedExecution: (params: unknown) => mockSupportsDelegatedExecution(params),
}));

jest.mock('@/raps/atomicSwapPreparation', () => ({
  prepareAtomicSwapCalls: (params: unknown) => mockPrepareAtomicSwapCalls(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const RECIPIENT = '0x4444444444444444444444444444444444444444' satisfies Address;
const SELL_TOKEN = '0x5555555555555555555555555555555555555555' satisfies Address;
const BUY_TOKEN = '0x6666666666666666666666666666666666666666' satisfies Address;
const PREPARED_CALLS = {
  executionId: 'prepared-deposit',
  kind: 'calls.managed',
  review: { fees: { payer: 'sponsor' } },
} as PreparedCallsExecution;

const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', ChainId.polygon);

function buildQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    allowanceNeeded: false,
    allowanceTarget: '0x1111111111111111111111111111111111111111',
    buyAmount: '1000000',
    buyAmountDisplay: '1000000',
    buyAmountDisplayMinimum: '1000000',
    buyAmountInEth: '0',
    buyAmountMinusFees: '1000000',
    buyTokenAddress: BUY_TOKEN,
    chainId: ChainId.polygon,
    data: '0x1234',
    fallback: false,
    fee: '0',
    feeInEth: '0',
    feePercentageBasisPoints: 0,
    from: ACCOUNT,
    sellAmount: '1000000',
    sellAmountDisplay: '1000000',
    sellAmountInEth: '0',
    sellAmountMinusFees: '1000000',
    sellTokenAddress: SELL_TOKEN,
    swapType: SwapType.normal,
    to: '0x7777777777777777777777777777777777777777',
    tradeAmountUSD: 1,
    tradeFeeAmountUSD: 0,
    value: '0',
    ...overrides,
  };
}

describe('prepareSponsoredDepositExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDelegationPublicClient.mockReturnValue({ name: 'public-client' });
    mockPredictSponsoredCallsExecution.mockReturnValue(true);
    mockPrepareCalls.mockResolvedValue(PREPARED_CALLS);
    mockSupportsDelegatedExecution.mockResolvedValue(true);
  });

  it('prepares a sponsor-paid ERC20 transfer for direct-transfer deposits', async () => {
    const quote = buildQuote();

    await expect(
      prepareSponsoredDepositExecution({
        accountAddress: ACCOUNT,
        chainId: ChainId.polygon,
        provider,
        quote,
        strategy: { recipient: RECIPIENT, type: 'directTransfer' },
      })
    ).resolves.toBe(PREPARED_CALLS);

    expect(mockPrepareAtomicSwapCalls).not.toHaveBeenCalled();
    expect(mockPrepareCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      calls: [
        {
          to: SELL_TOKEN,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [RECIPIENT, 1_000_000n],
          }),
        },
      ],
      chainId: ChainId.polygon,
      publicClient: { name: 'public-client' },
      requirements: mockSponsoredCallsRequirements,
    });
  });

  it('reuses atomic swap preparation for RAP-backed deposit strategies', async () => {
    const quote = buildQuote();
    const swapCall: Call = { data: '0xaaaa', to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', value: 0n };
    mockPrepareAtomicSwapCalls.mockResolvedValue([swapCall]);

    await expect(
      prepareSponsoredDepositExecution({
        accountAddress: ACCOUNT,
        chainId: ChainId.polygon,
        provider,
        quote,
        strategy: { rapType: 'swap', type: 'swap' },
      })
    ).resolves.toBe(PREPARED_CALLS);

    expect(mockPrepareAtomicSwapCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      chainId: ChainId.polygon,
      provider,
      quote,
    });
    expect(mockPrepareCalls).toHaveBeenCalledWith(
      expect.objectContaining({
        calls: [swapCall],
        requirements: mockSponsoredCallsRequirements,
      })
    );
  });

  it('skips preparation when sponsorship or delegated execution is unavailable', async () => {
    mockPredictSponsoredCallsExecution.mockReturnValue(false);

    await expect(
      prepareSponsoredDepositExecution({
        accountAddress: ACCOUNT,
        chainId: ChainId.polygon,
        provider,
        quote: buildQuote(),
        strategy: { recipient: RECIPIENT, type: 'directTransfer' },
      })
    ).resolves.toBeNull();

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();

    mockPredictSponsoredCallsExecution.mockReturnValue(true);
    mockSupportsDelegatedExecution.mockResolvedValue(false);

    await expect(
      prepareSponsoredDepositExecution({
        accountAddress: ACCOUNT,
        chainId: ChainId.polygon,
        provider,
        quote: buildQuote(),
        strategy: { recipient: RECIPIENT, type: 'directTransfer' },
      })
    ).resolves.toBeNull();

    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });
});
