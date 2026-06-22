import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { TransactionStatus, type NewTransaction } from '@/entities/transactions/transaction';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';

import {
  buildPendingSendTransaction,
  buildSendCall,
  executeSponsoredSend,
  predictSponsoredSend,
  prepareSponsoredSend,
} from './sponsoredSend';

const mockCanUseDelegatedExecution = jest.fn<boolean, [Address]>();
const mockCreateDelegationPublicClient = jest.fn<unknown, [ChainId, { signal?: AbortSignal }?]>();
const mockExecuteCalls = jest.fn<Promise<unknown>, [unknown, unknown?]>();
const mockIsSponsorshipEligible = jest.fn<boolean, [ChainId]>();
const mockPrepareCalls = jest.fn<Promise<unknown>, [unknown]>();
const mockResolveManagedExecutionFailure = jest.fn<Promise<string | null>, [unknown]>();
const mockSupportsDelegatedExecution = jest.fn<Promise<boolean>, [unknown]>();
const mockTrackCallsExecution = jest.fn<void, [unknown]>();

const mockRemoteConfig = {
  sponsored_sends_enabled: true,
};

const mockSponsoredCallsRequirements = {
  atomic: 'required',
  fees: { payer: 'sponsor' },
};

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    calls: (params: unknown, clients?: unknown) => mockExecuteCalls(params, clients),
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
}));

jest.mock('@/features/config/stores/remoteConfig', () => ({
  getRemoteConfig: () => mockRemoteConfig,
}));

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: {
    isSponsorshipEligible: (chainId: ChainId) => mockIsSponsorshipEligible(chainId),
  },
}));

jest.mock('./calls', () => ({
  createDelegationPublicClient: (chainId: ChainId, options?: { signal?: AbortSignal }) =>
    options ? mockCreateDelegationPublicClient(chainId, options) : mockCreateDelegationPublicClient(chainId),
  SPONSORED_CALLS_REQUIREMENTS: {
    atomic: 'required',
    fees: { payer: 'sponsor' },
  },
}));

jest.mock('./callsExecutionTracking', () => ({
  trackCallsExecution: (params: unknown) => mockTrackCallsExecution(params),
}));

jest.mock('./managedExecutionFailure', () => ({
  resolveManagedExecutionFailure: (params: unknown) => mockResolveManagedExecutionFailure(params),
}));

jest.mock('./willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
  supportsDelegatedExecution: (params: unknown) => mockSupportsDelegatedExecution(params),
}));

const ACCOUNT = '0x3333333333333333333333333333333333333333' satisfies Address;
const RECIPIENT = '0x4444444444444444444444444444444444444444' satisfies Address;
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const chainId = ChainId.base;
const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', chainId);
const signer = new Wallet(PRIVATE_KEY, provider);
const publicClient = { name: 'public-client' };

const sendCall: Call = {
  data: '0x1234',
  to: RECIPIENT,
  value: 123n,
};

const baseTransaction = {
  chainId,
  from: ACCOUNT,
  network: 'Base',
  nonce: -1,
  to: RECIPIENT,
} satisfies Omit<NewTransaction, 'hash' | 'status' | 'txTo' | 'type'>;

const pendingTransaction = {
  ...baseTransaction,
  data: sendCall.data,
  status: TransactionStatus.pending,
  txTo: sendCall.to,
  type: 'send',
  value: sendCall.value,
} satisfies Omit<NewTransaction, 'hash'>;

function executeWith(params?: Partial<Parameters<typeof executeSponsoredSend>[0]>) {
  return executeSponsoredSend({
    accountAddress: ACCOUNT,
    call: sendCall,
    chainId,
    preparedCalls: {
      executionId: 'prepared-send',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    } as PreparedCallsExecution,
    provider,
    signer,
    transaction: pendingTransaction,
    ...params,
  });
}

describe('sponsoredSend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoteConfig.sponsored_sends_enabled = true;
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockCreateDelegationPublicClient.mockReturnValue(publicClient);
    mockIsSponsorshipEligible.mockReturnValue(true);
    mockPrepareCalls.mockResolvedValue({
      executionId: 'prepared-send',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });
    mockResolveManagedExecutionFailure.mockResolvedValue(null);
    mockSupportsDelegatedExecution.mockResolvedValue(true);
  });

  it('requires remote config and a valid address before predicting sponsored sends', () => {
    mockRemoteConfig.sponsored_sends_enabled = false;

    expect(predictSponsoredSend({ address: ACCOUNT, chainId })).toBe(false);
    expect(mockCanUseDelegatedExecution).not.toHaveBeenCalled();

    mockRemoteConfig.sponsored_sends_enabled = true;

    expect(predictSponsoredSend({ address: 'not-an-address', chainId })).toBe(false);
    expect(mockCanUseDelegatedExecution).not.toHaveBeenCalled();
    expect(predictSponsoredSend({ address: ACCOUNT, chainId })).toBe(true);
  });

  it('builds send calls and pending send transactions from wallet transaction data', () => {
    const call = buildSendCall({
      data: Uint8Array.from([0x12, 0x34]),
      to: RECIPIENT,
      value: BigNumber.from(123),
    });

    expect(call).toEqual(sendCall);
    expect(
      buildPendingSendTransaction({
        call,
        transaction: baseTransaction,
      })
    ).toEqual(pendingTransaction);
  });

  it('prepares sponsored exact calls when feature, network, and wallet support allow it', async () => {
    await expect(prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId })).resolves.toEqual({
      executionId: 'prepared-send',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    expect(mockSupportsDelegatedExecution).toHaveBeenCalledWith({ address: ACCOUNT, chainId });
    expect(mockCreateDelegationPublicClient).toHaveBeenCalledWith(chainId);
    expect(mockPrepareCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      calls: [sendCall],
      chainId,
      publicClient,
      requirements: mockSponsoredCallsRequirements,
    });
  });

  it('uses cached delegation support when provided', async () => {
    await expect(prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId, delegationSupported: true })).resolves.toEqual({
      executionId: 'prepared-send',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
    expect(mockPrepareCalls).toHaveBeenCalledWith({
      account: ACCOUNT,
      calls: [sendCall],
      chainId,
      publicClient,
      requirements: mockSponsoredCallsRequirements,
    });
  });

  it('skips sponsored preparation when cached delegation support is false', async () => {
    await expect(
      prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId, delegationSupported: false })
    ).resolves.toBeNull();

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
    expect(mockCreateDelegationPublicClient).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });

  it('passes the abort signal to preparation RPCs', async () => {
    const abortController = new AbortController();

    await expect(
      prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId, signal: abortController.signal })
    ).resolves.toEqual({
      executionId: 'prepared-send',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    expect(mockCreateDelegationPublicClient).toHaveBeenCalledWith(chainId, { signal: abortController.signal });
  });

  it('does not prepare if the signal is already aborted', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId, signal: abortController.signal })
    ).resolves.toBeNull();

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
    expect(mockCreateDelegationPublicClient).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });

  it('skips sponsored preparation when the chain is not eligible', async () => {
    mockIsSponsorshipEligible.mockReturnValue(false);

    await expect(prepareSponsoredSend({ accountAddress: ACCOUNT, call: sendCall, chainId })).resolves.toBeNull();

    expect(mockSupportsDelegatedExecution).not.toHaveBeenCalled();
    expect(mockPrepareCalls).not.toHaveBeenCalled();
  });

  it('executes prepared sponsored sends through managed calls and tracks the relay execution', async () => {
    const managedExecution = {
      executionId: 'submitted-send',
      kind: 'calls.managed',
      status: 'PENDING',
    };
    mockExecuteCalls.mockResolvedValue(managedExecution);

    await expect(executeWith()).resolves.toBe(managedExecution);

    expect(mockExecuteCalls).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: 'prepared-send',
        kind: 'calls.managed',
      }),
      {
        chainId,
        provider,
        signer,
      }
    );
    expect(mockResolveManagedExecutionFailure).toHaveBeenCalledWith({
      executionId: 'submitted-send',
      status: 'PENDING',
    });
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId,
      execution: managedExecution,
      transaction: pendingTransaction,
    });
  });

  it('executes an unprepared send by building a sponsored exact-call request', async () => {
    const walletTransaction = {
      hash: TX_HASH,
      transaction: {
        data: sendCall.data,
        to: sendCall.to,
        value: sendCall.value,
      },
      type: 'eip1559',
    };
    const walletExecution = {
      kind: 'calls.wallet',
      transactions: [walletTransaction],
    };
    mockExecuteCalls.mockResolvedValue(walletExecution);

    await expect(executeWith({ preparedCalls: null })).resolves.toBe(walletExecution);

    expect(mockExecuteCalls).toHaveBeenCalledWith(
      {
        calls: [sendCall],
        chainId,
        provider,
        requirements: mockSponsoredCallsRequirements,
        signer,
      },
      undefined
    );
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId,
      execution: walletTransaction,
      transaction: pendingTransaction,
    });
  });

  it('raises managed execution failures before tracking the send', async () => {
    mockExecuteCalls.mockResolvedValue({
      executionId: 'failed-send',
      kind: 'calls.managed',
      status: 'FAILED',
    });
    mockResolveManagedExecutionFailure.mockResolvedValue('relay reverted');

    await expect(executeWith()).rejects.toThrow('[executeSponsoredSend]: relay reverted');

    expect(mockTrackCallsExecution).not.toHaveBeenCalled();
  });
});
