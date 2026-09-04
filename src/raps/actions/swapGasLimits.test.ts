import { StaticJsonRpcProvider } from '@ethersproject/providers';

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

jest.mock('@/handlers/web3', () => ({
  estimateGasWithPadding: jest.fn(),
  getProvider: jest.fn(),
  toHex: jest.fn(),
}));

jest.mock('@/state/performance/performance', () => ({
  executeFn: jest.fn(),
  Screens: { SWAPS: 'swaps' },
  TimeToSignOperation: { BroadcastTransaction: 'broadcastTransaction' },
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: { getState: jest.fn(() => ({ degenMode: false })) },
}));

jest.mock('@/raps/utils', () => ({
  CHAIN_IDS_WITH_TRACE_SUPPORT: [1],
  SWAP_GAS_PADDING: 1.1,
  estimateSwapGasLimitWithFakeApproval: jest.fn(),
  estimateTransactionsGasLimit: jest.fn(),
  getDefaultGasLimitForTrade: jest.fn(),
  getFallbackGasLimitForTrade: jest.fn(),
  overrideWithFastSpeedIfNeeded: jest.fn(),
  populateSwap: jest.fn(),
}));

jest.mock('./unlock', () => ({
  estimateApprove: jest.fn(),
  populateApprove: jest.fn(),
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
    jest.clearAllMocks();
    jest.mocked(getProvider).mockReturnValue(provider);
    jest.mocked(populateApprove).mockResolvedValue(transaction);
    jest.mocked(populateSwap).mockResolvedValue(transaction);
    jest.mocked(getDefaultGasLimitForTrade).mockReturnValue('2000000');
    jest.mocked(getFallbackGasLimitForTrade).mockReturnValue('525000');
    jest.mocked(estimateApprove).mockResolvedValue('55000');
  });

  it('uses a complete simulation estimate for both execution and fee display', async () => {
    jest.mocked(estimateTransactionsGasLimit).mockResolvedValue('410000');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '410000',
      feeEstimateGasLimit: '410000',
    });

    expect(estimateApprove).not.toHaveBeenCalled();
  });

  it('keeps the quote gas cap for execution while displaying the configured fallback estimate', async () => {
    jest.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '2055000',
      feeEstimateGasLimit: '580000',
    });
  });

  it('uses the configured fee fallback when fake-approval estimation fails', async () => {
    jest.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);
    jest.mocked(estimateSwapGasLimitWithFakeApproval).mockResolvedValue(undefined);

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 1, quote: { ...quote, chainId: 1 } })).resolves.toEqual({
      transactionGasLimit: '2055000',
      feeEstimateGasLimit: '580000',
    });
  });

  it('never projects a fee estimate above the transaction gas limit', async () => {
    jest.mocked(estimateTransactionsGasLimit).mockResolvedValue(undefined);
    jest.mocked(getDefaultGasLimitForTrade).mockReturnValue('300000');

    await expect(estimateUnlockAndSwapGasLimits({ chainId: 4663, quote })).resolves.toEqual({
      transactionGasLimit: '355000',
      feeEstimateGasLimit: '355000',
    });
  });
});
