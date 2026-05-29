import type { TransactionResponse } from '@ethersproject/abstract-provider';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, type Address } from 'viem';

import { TransactionDirection, TransactionStatus } from '@/entities/transactions';

import {
  RNBW_DECIMALS,
  RNBW_TOKEN_ADDRESS,
  RNBW_TOKEN_ICON_URL,
  RNBW_TOKEN_UNIQUE_ID,
  STAKING_ABI,
  STAKING_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
  STAKING_UNSTAKE_GAS_LIMIT,
} from '../constants';
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
const mockAddNewTransaction = jest.fn();
const mockBuildSyntheticRnbwSourceAsset = jest.fn();
const mockGetChainsName = jest.fn();

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

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  backendNetworksActions: {
    getChainsName: () => mockGetChainsName(),
  },
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: (params: unknown) => mockAddNewTransaction(params),
}));

jest.mock('./syntheticRnbwSourceAsset', () => ({
  buildSyntheticRnbwSourceAsset: () => mockBuildSyntheticRnbwSourceAsset(),
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
const TX_NONCE = 7;
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
    mockGetChainsName.mockReturnValue({ [STAKING_CHAIN_ID]: 'base' });
    mockBuildSyntheticRnbwSourceAsset.mockReturnValue({
      address: RNBW_TOKEN_ADDRESS,
      balance: { amount: '0', display: '0 RNBW' },
      chainId: STAKING_CHAIN_ID,
      chainName: 'Base',
      colors: { fallback: '#f2c745', primary: '#f2c745' },
      decimals: RNBW_DECIMALS,
      icon_url: RNBW_TOKEN_ICON_URL,
      isNativeAsset: false,
      mainnetAddress: RNBW_TOKEN_ADDRESS,
      name: 'Rainbow',
      native: {
        balance: { amount: '0', display: '$0.00' },
        price: { amount: 1, change: '0', display: '$1.00' },
      },
      nativePrice: 1,
      networks: {
        [STAKING_CHAIN_ID]: {
          address: RNBW_TOKEN_ADDRESS,
          decimals: RNBW_DECIMALS,
        },
      },
      price: { value: 1 },
      symbol: 'RNBW',
      uniqueId: RNBW_TOKEN_UNIQUE_ID,
    });
    mockLoadWallet.mockResolvedValue({
      sendTransaction: (params: unknown) => mockSendTransaction(params),
    });
    mockGetData.mockReturnValue(POSITION);
    mockFetch.mockResolvedValue(undefined);
    mockEstimateGas.mockResolvedValue({ toString: () => ESTIMATED_GAS_LIMIT });
    mockSendTransaction.mockResolvedValue({ hash: TX_HASH, nonce: TX_NONCE } as TransactionResponse);
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
      return { hash: TX_HASH, nonce: TX_NONCE } as TransactionResponse;
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

  it('adds a pending unstake transaction before waiting for confirmation', async () => {
    const { order, record } = recordCallOrder();
    mockAddNewTransaction.mockImplementation(() => {
      record('addNewTransaction');
    });
    mockWaitForWalletTransactions.mockImplementation(async () => {
      record('waitForWalletTransactions');
    });

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    const expectedAsset = expect.objectContaining({
      address: RNBW_TOKEN_ADDRESS,
      chainId: STAKING_CHAIN_ID,
      decimals: RNBW_DECIMALS,
      icon_url: RNBW_TOKEN_ICON_URL,
      isNativeAsset: false,
      mainnet_address: RNBW_TOKEN_ADDRESS,
      name: 'Rainbow',
      network: 'base',
      symbol: 'RNBW',
      uniqueId: RNBW_TOKEN_UNIQUE_ID,
    });
    expect(mockAddNewTransaction).toHaveBeenCalledWith({
      address: ACCOUNT,
      chainId: STAKING_CHAIN_ID,
      transaction: expect.objectContaining({
        asset: expectedAsset,
        chainId: STAKING_CHAIN_ID,
        changes: [
          expect.objectContaining({
            address_from: STAKING_CONTRACT_ADDRESS,
            address_to: ACCOUNT,
            asset: expectedAsset,
            direction: TransactionDirection.IN,
            value: '950000000000000000000',
          }),
        ],
        data: UNSTAKE_ALL_DATA,
        from: ACCOUNT,
        gasLimit: ESTIMATED_GAS_LIMIT,
        gasPrice: undefined,
        hash: TX_HASH,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        network: 'base',
        nonce: TX_NONCE,
        status: TransactionStatus.pending,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'unstake',
        value: '0',
      }),
    });
    expect(mockWaitForWalletTransactions).not.toHaveBeenCalled();
    await result.waitForConfirmation();
    expect(order).toEqual(['addNewTransaction', 'waitForWalletTransactions']);
  });

  it('returns after registering the pending unstake transaction', async () => {
    let resolveConfirmation: (() => void) | undefined;
    const confirmationPromise = new Promise<void>(resolve => {
      resolveConfirmation = resolve;
    });
    mockWaitForWalletTransactions.mockImplementation(() => confirmationPromise);

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });

    expect(result.txHash).toBe(TX_HASH);
    expect(mockAddNewTransaction).toHaveBeenCalled();
    expect(mockWaitForWalletTransactions).not.toHaveBeenCalled();

    const waitPromise = result.waitForConfirmation();
    expect(mockWaitForWalletTransactions).toHaveBeenCalledWith({ provider: PROVIDER, txHashes: [TX_HASH] });

    resolveConfirmation?.();
    await waitPromise;
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

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });
    await result.waitForConfirmation();

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

    const result = await unstakeRnbw({ address: ACCOUNT, gasParams: GAS_PARAMS });
    await result.waitForConfirmation();

    expect(mockWaitForWalletTransactions).toHaveBeenCalledWith({ provider: PROVIDER, txHashes: [TX_HASH] });
    expect(mockPollForStakingUpdate).toHaveBeenCalledWith(POSITION.poolShares);
    expect(order).toEqual(['waitForWalletTransactions', 'pollForStakingUpdate']);
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
