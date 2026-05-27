import { Wallet } from '@ethersproject/wallet';

import { SwapType, type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { executeDepositRap } from './depositRapExecution';

const mockWalletExecuteRap = jest.fn();

jest.mock('@/raps/execute', () => ({
  walletExecuteRap: (...args: unknown[]) => mockWalletExecuteRap(...args),
}));

jest.mock('@/features/delegation/sponsoredCalls', () => ({
  isInsufficientSponsorBalanceError: (message: string) => message.includes('INSUFFICIENT_SPONSOR_BALANCE'),
}));

jest.mock('@/handlers/web3', () => ({
  estimateGasWithPadding: jest.fn(),
  getProvider: jest.fn(() => ({})),
  toHex: jest.fn(),
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: () => ({
      getChainsName: () => ({
        1: 'Ethereum',
        8453: 'Base',
      }),
    }),
  },
}));

jest.mock('@/state/performance/performance', () => ({
  Screens: {
    FUNDING_DEPOSIT: 'FUNDING_DEPOSIT',
  },
  TimeToSignOperation: {
    SignTransaction: 'SignTransaction',
  },
  executeFn: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

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
    fallback: false,
    fee: '0',
    feeInEth: '0',
    feePercentageBasisPoints: 0,
    from: '0x3333333333333333333333333333333333333333',
    inputTokenDecimals: 6,
    outputTokenDecimals: 6,
    protocols: [],
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

const MOCK_ASSET = {
  address: '0x4444444444444444444444444444444444444444',
  chainId: 8453,
  decimals: 6,
  symbol: 'USDC',
  uniqueId: '0x4444444444444444444444444444444444444444_8453',
} as const;

const MOCK_CONFIG = {
  directTransferEnabled: false,
  to: {
    chainId: 8453,
    token: {
      address: '0x7777777777777777777777777777777777777777',
      decimals: 6,
      symbol: 'USDC',
    },
  },
} as const;

describe('executeDepositRap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes same-chain quotes as swap RAP actions', async () => {
    mockWalletExecuteRap.mockResolvedValue({ errorMessage: null, hash: '0xabc', nonce: 12 });

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 12,
      preparedCalls: null,
      quote: buildQuote(8453),
      wallet: {} as never,
    });

    expect(result).toEqual({
      executionStrategy: 'swap',
      hash: '0xabc',
      isConfirmed: false,
      sponsorship: 'walletPaid',
      success: true,
    });

    expect(mockWalletExecuteRap).toHaveBeenCalledWith(
      expect.anything(),
      'swap',
      expect.objectContaining({
        atomic: false,
        chainId: 8453,
        nonce: 12,
        quote: expect.objectContaining({ chainId: 8453 }),
      }),
      { preparedCalls: null }
    );
  });

  it('executes cross-chain quotes as crosschainSwap RAP actions', async () => {
    mockWalletExecuteRap.mockResolvedValue({ errorMessage: null, hash: '0xdef', nonce: 15 });

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: {
        ...MOCK_CONFIG,
        to: {
          ...MOCK_CONFIG.to,
          chainId: 1,
        },
      } as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 15,
      preparedCalls: null,
      quote: buildCrosschainQuote(8453),
      wallet: {} as never,
    });

    expect(result).toEqual({
      executionStrategy: 'crosschainSwap',
      hash: '0xdef',
      isConfirmed: false,
      sponsorship: 'walletPaid',
      success: true,
    });

    expect(mockWalletExecuteRap).toHaveBeenCalledWith(
      expect.anything(),
      'crosschainSwap',
      expect.objectContaining({
        atomic: false,
        chainId: 8453,
        nonce: 15,
        quote: expect.objectContaining({ swapType: SwapType.crossChain }),
      }),
      { preparedCalls: null }
    );
  });

  it('treats managed atomic execution without hash as success when sponsored calls are supplied', async () => {
    mockWalletExecuteRap.mockResolvedValue({ errorMessage: null, hash: null, nonce: undefined });
    const wallet = new Wallet('0x59c6995e998f97a5a0044966f0945382d4a8a7e3f89f8f51236aa0f5f7f6e8b8');

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 2,
      preparedCalls: {
        executionId: 'managed-123',
        kind: 'calls.managed',
        review: { fees: { payer: 'sponsor' } },
      } as never,
      quote: buildQuote(8453),
      wallet,
    });

    expect(result).toEqual({
      executionStrategy: 'swap',
      isConfirmed: false,
      sponsorship: 'sponsored',
      success: true,
    });

    expect(mockWalletExecuteRap).toHaveBeenCalledWith(
      wallet,
      'swap',
      expect.objectContaining({
        atomic: true,
      }),
      {
        preparedCalls: expect.objectContaining({
          kind: 'calls.managed',
        }),
      }
    );
  });

  it('keeps missing hash as a failure for non-sponsored execution', async () => {
    mockWalletExecuteRap.mockResolvedValue({ errorMessage: null, hash: null, nonce: undefined });

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 3,
      preparedCalls: null,
      quote: buildQuote(8453),
      wallet: {} as never,
    });

    expect(result).toEqual({
      error: 'No transaction hash returned',
      sponsorshipAttempted: false,
      success: false,
    });
  });

  it('normalizes RAP execution errors before returning a funding failure', async () => {
    mockWalletExecuteRap.mockResolvedValue({ errorMessage: 'Swap failed[details]', hash: null, nonce: undefined });

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 4,
      preparedCalls: null,
      quote: buildQuote(8453),
      wallet: {} as never,
    });

    expect(result).toEqual({
      error: 'Swap failed',
      sponsorshipAttempted: false,
      success: false,
    });
  });

  it('classifies depleted sponsor wallet failures', async () => {
    mockWalletExecuteRap.mockResolvedValue({
      errorMessage: 'Managed relay execution failed [INSUFFICIENT_SPONSOR_BALANCE]',
      hash: null,
      nonce: undefined,
    });
    const wallet = new Wallet('0x59c6995e998f97a5a0044966f0945382d4a8a7e3f89f8f51236aa0f5f7f6e8b8');

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 5,
      preparedCalls: {
        executionId: 'managed-456',
        kind: 'calls.managed',
        review: { fees: { payer: 'sponsor' } },
      } as never,
      quote: buildQuote(8453),
      wallet,
    });

    expect(result).toEqual({
      error: 'Managed relay execution failed ',
      sponsorshipAttempted: true,
      sponsorshipFailureReason: 'insufficientSponsorBalance',
      success: false,
    });
  });

  it('classifies managed relay execution failures separately from sponsor balance failures', async () => {
    mockWalletExecuteRap.mockResolvedValue({
      errorMessage: 'Managed relay execution reverted',
      hash: null,
      nonce: undefined,
    });
    const wallet = new Wallet('0x59c6995e998f97a5a0044966f0945382d4a8a7e3f89f8f51236aa0f5f7f6e8b8');

    const result = await executeDepositRap({
      asset: MOCK_ASSET as never,
      assetChainId: 8453 as never,
      config: MOCK_CONFIG as never,
      gasFeeParamsBySpeed: {} as never,
      gasParams: {} as never,
      nonce: 6,
      preparedCalls: {
        executionId: 'managed-789',
        kind: 'calls.managed',
        review: { fees: { payer: 'sponsor' } },
      } as never,
      quote: buildQuote(8453),
      wallet,
    });

    expect(result).toEqual({
      error: 'Managed relay execution reverted',
      sponsorshipAttempted: true,
      sponsorshipFailureReason: 'sponsoredRelayExecutionFailed',
      success: false,
    });
  });
});
