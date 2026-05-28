import type { TransactionResponse } from '@ethersproject/abstract-provider';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, type Address } from 'viem';

import { STAKING_ABI, STAKING_CHAIN_ID, STAKING_CONTRACT_ADDRESS, STAKING_UNSTAKE_GAS_LIMIT } from '../constants';
import { type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { unstakeRnbw } from './unstakeRnbw';

const mockGetProvider = jest.fn();
const mockLoadWallet = jest.fn<Promise<unknown>, [unknown]>();
const mockFetch = jest.fn<Promise<void>, [undefined, { force: boolean } | undefined]>();
const mockGetData = jest.fn<StakingPositionData | undefined, []>();
const mockSendTransaction = jest.fn<Promise<TransactionResponse>, [unknown]>();
const mockEstimateGas = jest.fn<Promise<{ toString: () => string }>, [unknown]>();
const mockPollForStakingUpdate = jest.fn<Promise<boolean>, [string]>();
const mockWaitForWalletTransactions = jest.fn<Promise<void>, [unknown]>();
const mockTrack = jest.fn();

jest.mock('@/analytics', () => ({
  analytics: {
    event: {
      rnbwStakingUnstake: 'rnbw_staking.unstake',
      rnbwStakingUnstakeFailed: 'rnbw_staking.unstake.failed',
    },
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: () => mockGetProvider(),
}));

jest.mock('@/model/wallet', () => ({
  loadWallet: (params: unknown) => mockLoadWallet(params),
}));

jest.mock('../stores/rnbwStakingPositionStore', () => ({
  useStakingPositionStore: {
    getState: () => ({
      fetch: (params: undefined, options?: { force: boolean }) => mockFetch(params, options),
      getData: () => mockGetData(),
    }),
  },
}));

jest.mock('./pollForStakingUpdate', () => ({
  pollForStakingUpdate: (originalStakedRnbwShares: string) => mockPollForStakingUpdate(originalStakedRnbwShares),
}));

jest.mock('./waitForWalletTransactions', () => ({
  waitForWalletTransactions: (params: unknown) => mockWaitForWalletTransactions(params),
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const ACCOUNT: Address = '0x3333333333333333333333333333333333333333';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const UNSTAKE_ALL_DATA = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
const GAS_PARAMS = { maxFeePerGas: '10', maxPriorityFeePerGas: '1' };
const ESTIMATED_GAS_LIMIT = '123456';
const PROVIDER = {
  estimateGas: (params: unknown) => mockEstimateGas(params),
  name: 'provider',
} as unknown as StaticJsonRpcProvider;

const POSITION: StakingPositionData = {
  allTiers: [],
  decimals: 18,
  exitFeePercentage: 5,
  hasPosition: true,
  lastUpdateTime: '0',
  pnl: {
    netProfit: '0',
    totalCashbackReceived: '0',
    totalExitFeePaid: '0',
    totalRnbwStaked: '0',
    totalRnbwUnstaked: '0',
    exchangeRateGain: '0',
  },
  sessionPnl: {
    netProfit: '0',
    totalCashbackReceived: '0',
    totalExitFeePaid: '0',
    totalRnbwStaked: '0',
    totalRnbwUnstaked: '0',
    exchangeRateGain: '50000000000000000000',
  },
  poolShares: '900000000000000000000',
  stakedRnbw: '1000000000000000000000',
  stakedValueInCurrency: '1000',
  stakingStartTime: '0',
  tier: { level: 1 } as unknown as StakingPositionData['tier'],
};

function recordCallOrder(): { order: string[]; record: (name: string) => void } {
  const order: string[] = [];
  return {
    order,
    record: (name: string) => {
      order.push(name);
    },
  };
}

describe('unstakeRnbw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProvider.mockReturnValue(PROVIDER);
    mockLoadWallet.mockResolvedValue({
      sendTransaction: (params: unknown) => mockSendTransaction(params),
    });
    mockGetData.mockReturnValue(POSITION);
    mockFetch.mockResolvedValue(undefined);
    mockEstimateGas.mockResolvedValue({ toString: () => ESTIMATED_GAS_LIMIT });
    mockSendTransaction.mockResolvedValue({ hash: TX_HASH } as TransactionResponse);
    mockPollForStakingUpdate.mockResolvedValue(true);
    mockWaitForWalletTransactions.mockResolvedValue(undefined);
  });

  it('refreshes the staking position before submission and sends unstakeAll() to the staking contract', async () => {
    const { order, record } = recordCallOrder();
    mockFetch.mockImplementation(async () => {
      record('fetch');
    });
    mockSendTransaction.mockImplementation(async () => {
      record('sendTransaction');
      return { hash: TX_HASH } as TransactionResponse;
    });

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(mockFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockGetProvider).toHaveBeenCalled();
    expect(mockLoadWallet).toHaveBeenCalledWith({ address: ACCOUNT, provider: PROVIDER });
    expect(mockEstimateGas).toHaveBeenCalledWith({
      data: UNSTAKE_ALL_DATA,
      from: ACCOUNT,
      to: STAKING_CONTRACT_ADDRESS,
    });
    expect(mockSendTransaction).toHaveBeenCalledWith({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: ESTIMATED_GAS_LIMIT,
    });
    expect(order).toEqual(['fetch', 'sendTransaction']);
  });

  it('throws when refreshed position data is missing', async () => {
    mockGetData.mockReturnValueOnce(POSITION).mockReturnValueOnce(undefined);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toThrow('[unstakeRnbw]: Position data missing');
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it('throws when the exit fee percentage changes between snapshot and refresh', async () => {
    mockGetData.mockReturnValueOnce({ ...POSITION, exitFeePercentage: 5 }).mockReturnValueOnce({ ...POSITION, exitFeePercentage: 7 });

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toThrow('[unstakeRnbw]: Exit fee percentage changed');
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it('uses the fallback gas limit when unstake gas estimation fails', async () => {
    mockEstimateGas.mockRejectedValueOnce(new Error('estimate failed'));

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(mockSendTransaction).toHaveBeenCalledWith({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: STAKING_UNSTAKE_GAS_LIMIT.toString(),
    });
  });

  it('waits for the wallet transaction to confirm before polling staking data', async () => {
    const { order, record } = recordCallOrder();
    mockWaitForWalletTransactions.mockImplementation(async () => {
      record('waitForWalletTransactions');
    });
    mockPollForStakingUpdate.mockImplementation(async () => {
      record('pollForStakingUpdate');
      return true;
    });

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(mockWaitForWalletTransactions).toHaveBeenCalledWith({ provider: PROVIDER, txHashes: [TX_HASH] });
    expect(mockPollForStakingUpdate).toHaveBeenCalledWith(POSITION.poolShares);
    expect(order).toEqual(['waitForWalletTransactions', 'pollForStakingUpdate']);
  });

  it('tracks the success analytics payload with the existing field set', async () => {
    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake', {
      chainId: STAKING_CHAIN_ID,
      txHash: TX_HASH,
      stakedAmount: '1000',
      expectedExitFee: '50',
      expectedReceiveAmount: '950',
      pnl: '0',
    });
  });

  it('tracks the failure analytics payload when submission fails', async () => {
    const error = new Error('boom');
    mockSendTransaction.mockRejectedValueOnce(error);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toBe(error);

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake.failed', {
      chainId: STAKING_CHAIN_ID,
      stakedAmount: '1000',
      errorMessage: 'boom',
    });
    expect(mockTrack).not.toHaveBeenCalledWith('rnbw_staking.unstake', expect.anything());
  });
});
