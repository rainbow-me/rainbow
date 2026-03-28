jest.mock('../utils', () => ({
  populateSwap: jest.fn(),
}));

jest.mock('@/handlers/web3', () => ({
  estimateGasWithPadding: jest.fn(),
  getProvider: jest.fn(),
  toHex: jest.fn(),
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: jest.fn(),
}));

jest.mock('@/state/performance/performance', () => ({
  Screens: {},
  TimeToSignOperation: {},
  executeFn: jest.fn(),
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: jest.fn(),
  },
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../common', () => ({
  swapMetadataStorage: {
    get: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../replay', () => ({
  extractReplayableExecution: jest.fn(),
}));

jest.mock('../transactionAsset', () => ({
  toTransactionAsset: jest.fn(),
}));

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { type Quote, SwapType } from '@rainbow-me/swaps';
import { REFERRER } from '@/references/constants';
import { prepareSwapCall } from './swap';
import { populateSwap } from '../utils';

const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', 8453);

function buildQuote(overrides: Partial<Quote> = {}): Quote {
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
    fallback: false,
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
    ...overrides,
  };
}

describe('prepareSwapCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appends the Rainbow referrer code for non-fallback quotes', async () => {
    const quote = buildQuote();

    jest.mocked(populateSwap).mockResolvedValue({
      data: '0xabcdef',
      to: quote.to,
      value: BigNumber.from(quote.value),
    });

    await expect(
      prepareSwapCall({
        provider,
        quote,
      })
    ).resolves.toEqual({
      data: `0xabcdef${keccak256(toUtf8Bytes(REFERRER)).slice(2, 10)}`,
      to: quote.to,
      value: 0n,
    });
  });

  it('preserves fallback quote calldata verbatim', async () => {
    const quote = buildQuote({
      data: '0xfeedface',
      fallback: true,
      to: '0x6666666666666666666666666666666666666666',
      value: '7',
    });

    await expect(
      prepareSwapCall({
        provider,
        quote,
      })
    ).resolves.toEqual({
      data: quote.data,
      to: quote.to,
      value: 7n,
    });

    expect(populateSwap).not.toHaveBeenCalled();
  });

  it('builds wrapped-native deposit calldata without populateSwap', async () => {
    const quote = buildQuote({
      buyAmount: '5',
      buyTokenAddress: '0x7777777777777777777777777777777777777777',
      sellTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      swapType: SwapType.wrap,
    });

    await expect(
      prepareSwapCall({
        provider,
        quote,
      })
    ).resolves.toEqual({
      data: '0xd0e30db0',
      to: quote.buyTokenAddress,
      value: 5n,
    });

    expect(populateSwap).not.toHaveBeenCalled();
  });
});
