import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { TransactionStatus, type NewTransaction } from '@/entities/transactions/transaction';
import { ChainId } from '@/state/backendNetworks/types';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';

import { walletExecuteRap } from './execute';
import { type RapSwapActionParameters } from './references';

const mockExecuteCalls = jest.fn<Promise<unknown>, [unknown, unknown?]>();
const mockCreateUnlockAndSwapRap = jest.fn<Promise<unknown>, [unknown]>();
const mockPrepareSwap = jest.fn<Promise<unknown>, [unknown]>();
const mockTrackCallsExecution = jest.fn<void, [unknown]>();
const mockTrackManagedCallsExecutionResult = jest.fn<Promise<string | null>, [unknown]>();

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    calls: (params: unknown, clients?: unknown) => mockExecuteCalls(params, clients),
    prepare: {
      calls: jest.fn(),
    },
  },
}));

jest.mock('@/features/delegation/callsExecutionTracking', () => ({
  trackCallsExecution: (params: unknown) => mockTrackCallsExecution(params),
  trackManagedCallsExecutionResult: (params: unknown) => mockTrackManagedCallsExecutionResult(params),
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: () => ({ name: 'provider' }),
}));

jest.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/state/performance/performance', () => ({
  executeFn: (fn: (...args: unknown[]) => unknown) => fn,
  Screens: {
    SWAPS: 'SWAPS',
  },
  TimeToSignOperation: {
    BroadcastTransaction: 'BroadcastTransaction',
    CreateRap: 'CreateRap',
  },
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: () => ({ degenMode: false }),
  },
}));

jest.mock('./actions', () => ({
  swap: jest.fn(),
  unlock: jest.fn(),
}));

jest.mock('./actions/claimClaimable', () => ({
  claimClaimable: jest.fn(),
}));

jest.mock('./actions/crosschainSwap', () => ({
  crosschainSwap: jest.fn(),
  prepareCrosschainSwap: jest.fn(),
}));

jest.mock('./actions/swap', () => ({
  prepareSwap: (params: unknown) => mockPrepareSwap(params),
}));

jest.mock('./actions/unlock', () => ({
  prepareUnlock: jest.fn(),
}));

jest.mock('./atomicSwapPreparation', () => ({
  buildAtomicExecutionRequirements: () => ({ atomic: 'required', fees: { payer: 'sponsor' } }),
}));

jest.mock('./claimClaimable', () => ({
  createClaimClaimableRap: jest.fn(),
}));

jest.mock('./unlockAndCrosschainSwap', () => ({
  createUnlockAndCrosschainSwapRap: jest.fn(),
}));

jest.mock('./unlockAndSwap', () => ({
  createUnlockAndSwapRap: (params: unknown) => mockCreateUnlockAndSwapRap(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const chainId = ChainId.base;
const signer = new Wallet(PRIVATE_KEY);

const swapCall: Call = {
  data: '0x1234',
  to: '0x4444444444444444444444444444444444444444',
  value: 123n,
};

const pendingSwapTransaction = {
  chainId,
  data: swapCall.data,
  from: ACCOUNT,
  network: 'Base',
  nonce: 7,
  status: TransactionStatus.pending,
  to: swapCall.to,
  type: 'swap',
  value: swapCall.value,
} satisfies Omit<NewTransaction, 'hash'>;

const swapParameters = {
  atomic: true,
  chainId,
  gasFeeParamsBySpeed: {},
  gasParams: {},
  nonce: pendingSwapTransaction.nonce,
  quote: {
    from: ACCOUNT,
  },
} as unknown as RapSwapActionParameters<'swap'>;

describe('walletExecuteRap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUnlockAndSwapRap.mockResolvedValue({
      actions: [{ type: 'swap', parameters: swapParameters }],
    });
    mockPrepareSwap.mockResolvedValue({
      call: swapCall,
      transaction: pendingSwapTransaction,
    });
    mockTrackManagedCallsExecutionResult.mockResolvedValue(null);
  });

  it('records failed sponsored swaps before returning relay errors', async () => {
    const preparedCalls = {
      executionId: 'prepared-swap',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    } as PreparedCallsExecution;
    const failedExecution = {
      executionId: 'failed-swap',
      kind: 'calls.managed',
      status: 'FAILED',
    };
    mockExecuteCalls.mockResolvedValue(failedExecution);
    mockTrackManagedCallsExecutionResult.mockResolvedValue('relay reverted');

    await expect(walletExecuteRap(signer, 'swap', swapParameters, { preparedCalls })).resolves.toEqual({
      errorMessage: 'relay reverted',
      hash: null,
      nonce: undefined,
    });

    expect(mockTrackManagedCallsExecutionResult).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: true,
      execution: failedExecution,
      transaction: pendingSwapTransaction,
    });
    expect(mockTrackCallsExecution).not.toHaveBeenCalled();
  });
});
