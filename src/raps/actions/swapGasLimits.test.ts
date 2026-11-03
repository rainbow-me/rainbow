import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProvider } from '@/handlers/web3';
import {
  estimateSwapGasLimitWithFakeApproval,
  estimateTransactionsGasLimit,
  getDefaultGasLimitForTrade,
  getFallbackGasLimitForTrade,
  populateSwap,
} from '@/raps/utils';
import { SwapType, type Quote } from '@rainbow-me/swaps';

import { estimateUnlockAndSwapGasLimits } from './swap';
import { estimateApprove, populateApprove } from './unlock';

vi.mock('@/handlers/web3', () => ({
  estimateGasWithPadding: vi.fn(),
  getProvider: vi.fn(),
  toHex: vi.fn(),
}));

vi.mock('@/state/performance/performance', () => ({
  executeFn: vi.fn(),
  Screens: { SWAPS: 'swaps' },
  TimeToSignOperation: { BroadcastTransaction: 'broadcastTransaction' },
}));

vi.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: { getState: vi.fn(() => ({ degenMode: false })) },
}));

vi.mock('@/raps/utils', () => ({
  CHAIN_IDS_WITH_TRACE_SUPPORT: [1],
  SWAP_GAS_PADDING: 1.1,
  estimateSwapGasLimitWithFakeApproval: vi.fn(),
  estimateTransactionsGasLimit: vi.fn(),
  getDefaultGasLimitForTrade: vi.fn(),
  getFallbackGasLimitForTrade: vi.fn(),
  overrideWithFastSpeedIfNeeded: vi.fn(),
  populateSwap: vi.fn(),
}));

vi.mock('./unlock', () => ({
  estimateApprove: vi.fn(),
  populateApprove: vi.fn(),
}));

const quote: Quote = {
  allowanceNeeded: true,
  allowanceTarget: '0x00000000009726632680fb29d3f7a9734e3010e2',
  buyAmount: '1',
  buyAmountDisplay: '1',
  buyAmountDisplayMinimum: '1',
  buyAmountInEth: '1',
  buyAmountMinusFees: '1',
  buyTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  chainId: 4663,
  defaultGasLimit: '2000000',
  fee: '0',
  feeInEth: '0',
  feePercentageBasisPoints: 0,
  from: '0x1111111111111111111111111111111111111111',
  sellAmount: '236400',
  sellAmountDisplay: '0.2364',
  sellAmountInEth: '1',
  sellAmountMinusFees: '236400',
  sellTokenAddress: '0x5fc5360d0400a0fd4f2af552add042d716f1d168',
  swapType: SwapType.normal,
  tradeAmountUSD: 0.24,
  tradeFeeAmountUSD: 0,
};

const transaction = {
  data: '0x1234',
  from: quote.from,
  to: quote.allowanceTarget,
};

const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', 4663);

describe('estimateUnlockAndSwapGasLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProvider).mockReturnValue(provider);
    vi.mocked(populateApprove).mockResolvedValue(transaction);
    vi.mocked(populateSwap).mockResolvedValue(transaction);
    vi.mocked(getDefaultGasLimitForTrade).mockReturnValue('2000000');
    vi.mocked(getFallbackGasLimitForTrade).mockReturnValue('525000');
    vi.mocked(estimateApprove).mockResolvedValue('55000');
    vi.mocked(estimateSwapGasLimitWithFakeApproval).mockResolvedValue(undefined);
  });

  it('uses a complete simulation estimate for both execution and fee display', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue('410000');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '410000',
      feeEstimateGasLimit: '410000',
    });

    expect(estimateApprove).not.toHaveBeenCalled();
  });

  it.each([' ', 'Infinity'])('uses fallback estimates when simulation returns %o', async gasLimit => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(gasLimit);

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '2055000',
      feeEstimateGasLimit: '580000',
    });
  });

  it('keeps the quote gas cap for execution while displaying the configured fallback estimate', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '2055000',
      feeEstimateGasLimit: '580000',
    });
  });

  it('uses a fake-approval estimate when available', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);
    vi.mocked(estimateSwapGasLimitWithFakeApproval).mockResolvedValue('410000');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 1, quote: { ...quote, chainId: 1 } })).resolves.toEqual({
      transactionGasLimit: '465000',
      feeEstimateGasLimit: '465000',
    });
  });

  it('uses the configured fee fallback when no fake-approval estimate is available', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 1, quote: { ...quote, chainId: 1 } })).resolves.toEqual({
      transactionGasLimit: '2055000',
      feeEstimateGasLimit: '580000',
    });
  });

  it('uses fallback estimates when approval estimation returns a non-finite value', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);
    vi.mocked(estimateApprove).mockResolvedValue('Infinity');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '2000000',
      feeEstimateGasLimit: '525000',
    });
  });

  it('never projects a fee estimate above the transaction gas limit', async () => {
    vi.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);
    vi.mocked(getDefaultGasLimitForTrade).mockReturnValue('300000');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '355000',
      feeEstimateGasLimit: '355000',
    });
  });
});
