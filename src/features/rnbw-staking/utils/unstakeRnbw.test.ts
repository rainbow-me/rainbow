import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { STAKING_CHAIN_ID } from '../constants';
import { type StakingPositionData } from '../stores/rnbwStakingPositionStore';
import { type RnbwStakingExecution } from './executeRnbwStakingCalls';
import { type PreparedUnstakeRnbw } from './prepareUnstakeRnbw';
import { unstakeRnbw } from './unstakeRnbw';

const mockGetProvider = jest.fn();
const mockLoadWallet = jest.fn<Promise<unknown>, [unknown]>();
const mockFetch = jest.fn<Promise<void>, [undefined, { force: boolean } | undefined]>();
const mockGetData = jest.fn<StakingPositionData | undefined, []>();
const mockExecuteUnstakeRnbw = jest.fn<Promise<RnbwStakingExecution>, [unknown]>();
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
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const GAS_PARAMS = { maxFeePerGas: '10', maxPriorityFeePerGas: '1' };
const PROVIDER = { name: 'provider' };
const PREPARED_CALLS = {
  preparedCalls: {
    executionId: 'prepared-unstake',
    kind: 'calls.managed',
    review: { fees: { payer: 'sponsor' } },
  },
} as unknown as PreparedUnstakeRnbw;

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

function manualExecution(): RnbwStakingExecution {
  return {
    executionMode: 'manual',
    txHash: TX_HASH,
    waitForConfirmation: () => Promise.resolve(),
  };
}

function sponsoredExecution(): RnbwStakingExecution {
  return {
    executionMode: 'sponsored',
    executionId: 'submitted-unstake',
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
    mockLoadWallet.mockResolvedValue(new Wallet(PRIVATE_KEY));
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

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) });

    expect(mockFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockGetProvider).toHaveBeenCalled();
    expect(mockLoadWallet).toHaveBeenCalledWith({ address: ACCOUNT, provider: PROVIDER });
    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ACCOUNT,
        expectedReceiveAmountRaw: '950000000000000000000',
        gasParams: GAS_PARAMS,
        preparedCalls: null,
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

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) });

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

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) })).rejects.toThrow(
      '[unstakeRnbw]: Position data missing'
    );
    expect(mockExecuteUnstakeRnbw).not.toHaveBeenCalled();
  });

  it('throws when the exit fee percentage changes between snapshot and refresh', async () => {
    mockGetData.mockReturnValueOnce({ ...POSITION, exitFeePercentage: 5 }).mockReturnValueOnce({ ...POSITION, exitFeePercentage: 7 });

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) })).rejects.toThrow(
      '[unstakeRnbw]: Exit fee percentage changed'
    );
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

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) });
    await result.waitForConfirmation();

    expect(mockPollForStakingUpdate).toHaveBeenCalledWith(POSITION.poolShares);
    expect(order).toEqual(['waitForConfirmation', 'pollForStakingUpdate']);
  });

  it('tracks the success analytics payload with executionMode and txHash for manual execution', async () => {
    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) });
    await result.waitForConfirmation();

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'manual',
      txHash: TX_HASH,
      executionId: undefined,
      stakedAmount: '1000',
      expectedExitFee: '50',
      expectedReceiveAmount: '950',
      pnl: '0',
    });
  });

  it('passes prepared calls through to executeUnstakeRnbw when the resolved signer is a software wallet', async () => {
    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(PREPARED_CALLS) });

    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        preparedCalls: PREPARED_CALLS.preparedCalls,
      })
    );
  });

  it('skips prepared calls when the signer is not a software wallet', async () => {
    const hardwareSigner = { sendTransaction: jest.fn() };
    mockLoadWallet.mockResolvedValue(hardwareSigner);

    await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(PREPARED_CALLS) });

    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        preparedCalls: null,
      })
    );
  });

  it('tracks executionId and sponsored execution mode in the success analytics payload', async () => {
    mockExecuteUnstakeRnbw.mockResolvedValue(sponsoredExecution());

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(PREPARED_CALLS) });
    await result.waitForConfirmation();

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'sponsored',
      txHash: undefined,
      executionId: 'submitted-unstake',
      stakedAmount: '1000',
      expectedExitFee: '50',
      expectedReceiveAmount: '950',
      pnl: '0',
    });
  });

  it('tracks the failure analytics payload when submission fails', async () => {
    const error = new Error('boom');
    mockExecuteUnstakeRnbw.mockRejectedValueOnce(error);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) })).rejects.toBe(error);

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake.failed', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'manual',
      stakedAmount: '1000',
      errorMessage: 'boom',
    });
    expect(mockTrack).not.toHaveBeenCalledWith('rnbw_staking.unstake', expect.anything());
  });

  it('allows a zero exit fee percentage', async () => {
    mockGetData.mockReturnValue({ ...POSITION, exitFeePercentage: 0 });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(null) });
    await result.waitForConfirmation();

    expect(mockExecuteUnstakeRnbw).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedReceiveAmountRaw: POSITION.stakedRnbw,
      })
    );
    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'manual',
      txHash: TX_HASH,
      executionId: undefined,
      stakedAmount: '1000',
      expectedExitFee: '0',
      expectedReceiveAmount: '1000',
      pnl: '50',
    });
  });

  it('records sponsored execution mode when sponsored submission fails before returning an execution', async () => {
    const error = new Error('relay rejected execution');
    mockExecuteUnstakeRnbw.mockRejectedValueOnce(error);

    await expect(unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(PREPARED_CALLS) })).rejects.toBe(
      error
    );

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake.failed', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'sponsored',
      stakedAmount: '1000',
      errorMessage: 'relay rejected execution',
    });
  });

  it('records the sponsored execution mode on failure analytics when sponsored execution reports a relay failure', async () => {
    const error = new Error('relay reported failure');
    mockExecuteUnstakeRnbw.mockResolvedValueOnce({
      executionMode: 'sponsored',
      executionId: 'submitted-unstake',
      waitForConfirmation: async () => {
        throw error;
      },
    });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS, preparedCalls: Promise.resolve(PREPARED_CALLS) });
    await expect(result.waitForConfirmation()).rejects.toBe(error);

    expect(mockTrack).toHaveBeenCalledWith('rnbw_staking.unstake.failed', {
      chainId: STAKING_CHAIN_ID,
      executionMode: 'sponsored',
      stakedAmount: '1000',
      errorMessage: 'relay reported failure',
    });
  });
});
