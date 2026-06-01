import { type Address } from 'viem';

import { STAKING_CHAIN_ID } from '../constants';
import { type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { type UnstakeRnbwExecution } from './executeUnstakeRnbw';
import { unstakeRnbw } from './unstakeRnbw';

const mockGetProvider = jest.fn();
const mockLoadWallet = jest.fn<Promise<unknown>, [unknown]>();
const mockFetch = jest.fn<Promise<void>, [undefined, { force: boolean } | undefined]>();
const mockGetData = jest.fn<StakingPositionData | undefined, []>();
const mockExecuteUnstakeRnbw = jest.fn<Promise<UnstakeRnbwExecution>, [unknown]>();
const mockPollForStakingUpdate = jest.fn<Promise<boolean>, [string]>();
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

jest.mock('./executeUnstakeRnbw', () => ({
  executeUnstakeRnbw: (params: unknown) => mockExecuteUnstakeRnbw(params),
}));

jest.mock('./pollForStakingUpdate', () => ({
  pollForStakingUpdate: (originalStakedRnbwShares: string) => mockPollForStakingUpdate(originalStakedRnbwShares),
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const ACCOUNT: Address = '0x3333333333333333333333333333333333333333';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const GAS_PARAMS = { maxFeePerGas: '10', maxPriorityFeePerGas: '1' };
const PROVIDER = { name: 'provider' };

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

function manualExecution(): UnstakeRnbwExecution {
  return {
    executionMode: 'manual',
    txHash: TX_HASH,
    waitForConfirmation: () => Promise.resolve(),
  };
}

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
    mockLoadWallet.mockResolvedValue({ sendTransaction: jest.fn() });
    mockGetData.mockReturnValue(POSITION);
    mockFetch.mockResolvedValue(undefined);
    mockExecuteUnstakeRnbw.mockResolvedValue(manualExecution());
    mockPollForStakingUpdate.mockResolvedValue(true);
  });

  it('refreshes the staking position before submission and delegates to executeUnstakeRnbw', async () => {
    const { order, record } = recordCallOrder();
    mockFetch.mockImplementation(async () => {
      record('fetch');
    });
    mockExecuteUnstakeRnbw.mockImplementation(async () => {
      record('execute');
      return manualExecution();
    });

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(mockFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockGetProvider).toHaveBeenCalled();
    expect(mockLoadWallet).toHaveBeenCalledWith({ address: ACCOUNT, provider: PROVIDER });
    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ACCOUNT,
        expectedReceiveAmountRaw: '950000000000000000000',
        gasParams: GAS_PARAMS,
        provider: PROVIDER,
      })
    );
    expect(order).toEqual(['fetch', 'execute']);
  });

  it('returns after submitting the unstake execution', async () => {
    let resolveConfirmation: (() => void) | undefined;
    const confirmationPromise = new Promise<void>(resolve => {
      resolveConfirmation = resolve;
    });
    mockExecuteUnstakeRnbw.mockResolvedValue({
      executionMode: 'manual',
      txHash: TX_HASH,
      waitForConfirmation: () => confirmationPromise,
    });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(result.txHash).toBe(TX_HASH);
    expect(mockExecuteUnstakeRnbw).toHaveBeenCalled();
    expect(mockPollForStakingUpdate).not.toHaveBeenCalled();

    const waitPromise = result.waitForConfirmation();
    expect(mockPollForStakingUpdate).not.toHaveBeenCalled();

    resolveConfirmation?.();
    await waitPromise;
    expect(mockPollForStakingUpdate).toHaveBeenCalledWith(POSITION.poolShares);
  });

  it('throws when refreshed position data is missing', async () => {
    mockGetData.mockReturnValueOnce(POSITION).mockReturnValueOnce(undefined);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toThrow('[unstakeRnbw]: Position data missing');
    expect(mockExecuteUnstakeRnbw).not.toHaveBeenCalled();
  });

  it('throws when the exit fee percentage changes between snapshot and refresh', async () => {
    mockGetData.mockReturnValueOnce({ ...POSITION, exitFeePercentage: 5 }).mockReturnValueOnce({ ...POSITION, exitFeePercentage: 7 });

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toThrow('[unstakeRnbw]: Exit fee percentage changed');
    expect(mockExecuteUnstakeRnbw).not.toHaveBeenCalled();
  });

  it('waits for the execution to confirm before polling staking data', async () => {
    const { order, record } = recordCallOrder();
    mockExecuteUnstakeRnbw.mockResolvedValue({
      executionMode: 'manual',
      txHash: TX_HASH,
      waitForConfirmation: async () => {
        record('waitForConfirmation');
      },
    });
    mockPollForStakingUpdate.mockImplementation(async () => {
      record('pollForStakingUpdate');
      return true;
    });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });
    await result.waitForConfirmation();

    expect(mockPollForStakingUpdate).toHaveBeenCalledWith(POSITION.poolShares);
    expect(order).toEqual(['waitForConfirmation', 'pollForStakingUpdate']);
  });

  it('tracks the success analytics payload with the existing field set', async () => {
    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });
    await result.waitForConfirmation();

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
    mockExecuteUnstakeRnbw.mockRejectedValueOnce(error);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS })).rejects.toBe(error);

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake.failed', {
      chainId: STAKING_CHAIN_ID,
      stakedAmount: '1000',
      errorMessage: 'boom',
    });
    expect(mockTrack).not.toHaveBeenCalledWith('rnbw_staking.unstake', expect.anything());
  });

  it('allows a zero exit fee percentage', async () => {
    mockGetData.mockReturnValue({ ...POSITION, exitFeePercentage: 0 });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });
    await result.waitForConfirmation();

    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedReceiveAmountRaw: POSITION.stakedRnbw,
      })
    );
    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake', {
      chainId: STAKING_CHAIN_ID,
      txHash: TX_HASH,
      stakedAmount: '1000',
      expectedExitFee: '0',
      expectedReceiveAmount: '1000',
      pnl: '50',
    });
  });
});
