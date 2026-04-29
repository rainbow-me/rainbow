import type { Provider, TransactionReceipt, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';
import { resolveProperties, type Deferrable } from '@ethersproject/properties';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { type Address } from 'viem';

import { TransactionDirection, TransactionStatus } from '@/entities/transactions';
import { type TransactionAssetSource } from '@/raps/transactionAsset';
import { time } from '@/utils/time';
import { execute, type Call, type CallsRequirements, type PreparedCallsExecution } from '@rainbow-me/delegation';

import {
  RNBW_DECIMALS,
  RNBW_TOKEN_ADDRESS,
  RNBW_TOKEN_UNIQUE_ID,
  STAKING_APPROVAL_GAS_LIMIT,
  STAKING_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
} from '../constants';
import { executeStakeRnbw } from './executeStakeRnbw';

const mockExecuteCalls = jest.fn<Promise<unknown>, [unknown, unknown?]>();
const mockPrepareCalls = jest.fn<Promise<unknown>, [unknown]>();
const mockBuildStakeRnbwCalls = jest.fn<Promise<Call[]>, [unknown]>();
const mockBuildStakeRnbwExecutionPlan = jest.fn<Promise<{ calls: Call[]; requirements?: CallsRequirements }>, [unknown]>();
const mockResolveManagedExecutionFailure = jest.fn<Promise<string | null>, [unknown]>();
const mockTrackCallsExecution = jest.fn<void, [unknown]>();
const mockWaitForManagedExecutionConfirmation = jest.fn<Promise<void>, [string]>();
const mockAddNewTransaction = jest.fn<void, [unknown]>();

jest.mock('@rainbow-me/delegation', () => ({
  execute: {
    calls: (params: unknown, clients?: unknown) => mockExecuteCalls(params, clients),
    prepare: {
      calls: (params: unknown) => mockPrepareCalls(params),
    },
  },
  RelayExecutionStatus: {
    Confirmed: 'CONFIRMED',
    Failed: 'FAILED',
    Pending: 'PENDING',
    Reverted: 'REVERTED',
  },
}));

jest.mock('@/features/delegation/managedExecutionFailure', () => ({
  resolveManagedExecutionFailure: (params: unknown) => mockResolveManagedExecutionFailure(params),
}));

jest.mock('@/features/delegation/callsExecutionTracking', () => ({
  trackCallsExecution: (params: unknown) => mockTrackCallsExecution(params),
}));

jest.mock('@/features/delegation/waitForManagedExecution', () => ({
  waitForManagedExecutionConfirmation: (executionId: string) => mockWaitForManagedExecutionConfirmation(executionId),
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: (params: unknown) => mockAddNewTransaction(params),
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  backendNetworksActions: {
    getChainsName: () => ({ 8453: 'Base' }),
  },
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

jest.mock('./stakeRnbwCalls', () => ({
  buildStakeRnbwCalls: (params: unknown) => mockBuildStakeRnbwCalls(params),
  buildStakeRnbwExecutionPlan: (params: unknown) => mockBuildStakeRnbwExecutionPlan(params),
}));

const ACCOUNT: Address = '0x3333333333333333333333333333333333333333';
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const STAKE_AMOUNT_RAW = '1000000000000000000';
const APPROVAL_TX_HASH = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const APPROVAL_CALL: Call = { data: '0x095ea7b3', to: RNBW_TOKEN_ADDRESS, value: 0n };
const STAKE_CALL: Call = { data: '0xa694fc3a', to: STAKING_CONTRACT_ADDRESS, value: 0n };
const SPONSORED_REQUIREMENTS: CallsRequirements = { atomic: 'required', fees: { payer: 'sponsor' } };
const SPONSORED_PLAN = { calls: [APPROVAL_CALL, STAKE_CALL], requirements: SPONSORED_REQUIREMENTS };

const GAS_PARAMS = { maxFeePerGas: '6000000', maxPriorityFeePerGas: '1000000' };
const ESTIMATED_STAKE_GAS_LIMIT = BigNumber.from(103_406);

const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', STAKING_CHAIN_ID);
const signer = new Wallet(PRIVATE_KEY, provider);

class TestHardwareSigner extends Signer {
  readonly provider: Provider;
  readonly sendTransactionMock = jest.fn<Promise<TransactionResponse>, [Deferrable<TransactionRequest>]>();

  constructor(provider: Provider) {
    super();
    this.provider = provider;
  }

  connect(provider: Provider): Signer {
    return new TestHardwareSigner(provider);
  }

  getAddress(): Promise<string> {
    return Promise.resolve(ACCOUNT);
  }

  signMessage(): Promise<string> {
    return Promise.resolve('0x');
  }

  signTransaction(): Promise<string> {
    return Promise.resolve('0x');
  }

  sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    return this.sendTransactionMock(transaction);
  }
}

const rnbwAsset = {
  address: RNBW_TOKEN_ADDRESS,
  chainId: STAKING_CHAIN_ID,
  chainName: 'Base',
  colors: { fallback: '#f2c745', primary: '#f2c745' },
  decimals: RNBW_DECIMALS,
  isNativeAsset: false,
  mainnetAddress: RNBW_TOKEN_ADDRESS,
  name: 'Rainbow',
  native: {
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
} satisfies TransactionAssetSource;

function buildReceipt(transactionHash = TX_HASH): TransactionReceipt {
  return {
    blockHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    blockNumber: 1,
    byzantium: true,
    confirmations: 1,
    contractAddress: '',
    cumulativeGasUsed: BigNumber.from(21_000),
    effectiveGasPrice: BigNumber.from(1),
    from: ACCOUNT,
    gasUsed: BigNumber.from(21_000),
    logs: [],
    logsBloom: '0x',
    status: 1,
    to: STAKING_CONTRACT_ADDRESS,
    transactionHash,
    transactionIndex: 0,
    type: 2,
  };
}

function buildTransactionResponse({
  hash = TX_HASH,
  nonce = 1,
  transaction,
}: {
  hash?: string;
  nonce?: number;
  transaction: Deferrable<TransactionRequest>;
}): Promise<TransactionResponse> {
  return resolveProperties(transaction).then(request => ({
    chainId: STAKING_CHAIN_ID,
    confirmations: 0,
    data: request.data ? hexlify(request.data) : '0x',
    from: ACCOUNT,
    gasLimit: BigNumber.from(request.gasLimit ?? 21_000),
    gasPrice: BigNumber.from(1),
    hash,
    maxFeePerGas: request.maxFeePerGas == null ? undefined : BigNumber.from(request.maxFeePerGas),
    maxPriorityFeePerGas: request.maxPriorityFeePerGas == null ? undefined : BigNumber.from(request.maxPriorityFeePerGas),
    nonce,
    to: request.to,
    value: BigNumber.from(request.value ?? 0),
    wait: () => Promise.resolve(buildReceipt(hash)),
  }));
}

function mockSubmittedTransactions(signer: TestHardwareSigner, submissions: { hash: string; nonce: number }[]): void {
  let index = 0;
  signer.sendTransactionMock.mockImplementation(transaction => {
    const submission = submissions[index];
    if (!submission) throw new Error(`Unexpected staking transaction ${index + 1}`);
    index += 1;
    return buildTransactionResponse({ ...submission, transaction });
  });
}

async function prepareCalls(plan: unknown): Promise<PreparedCallsExecution> {
  mockPrepareCalls.mockResolvedValueOnce(plan);
  return execute.prepare.calls({
    calls: [STAKE_CALL],
    chainId: STAKING_CHAIN_ID,
    provider,
    signer,
  });
}

function defer<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolveDeferred: (value: T) => void = () => undefined;
  const promise = new Promise<T>(resolve => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

async function waitForMockCalls(mock: { mock: { calls: unknown[][] } }, count: number): Promise<void> {
  for (let attempt = 0; attempt < 10 && mock.mock.calls.length < count; attempt++) {
    await Promise.resolve();
  }
  if (mock.mock.calls.length < count) throw new Error(`Expected mock to be called ${count} times`);
}

async function submittedRequest(signer: TestHardwareSigner, transactionNumber: number): Promise<TransactionRequest> {
  const call = signer.sendTransactionMock.mock.calls[transactionNumber - 1];
  if (!call) throw new Error(`Missing staking transaction ${transactionNumber}`);
  return resolveProperties(call[0]);
}

describe('executeStakeRnbw', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockBuildStakeRnbwCalls.mockResolvedValue([STAKE_CALL]);
    mockBuildStakeRnbwExecutionPlan.mockResolvedValue({ calls: [STAKE_CALL] });
    mockResolveManagedExecutionFailure.mockResolvedValue(null);
    mockWaitForManagedExecutionConfirmation.mockResolvedValue();
  });

  it('executes manual staking through wallet exact calls and waits for submitted hashes', async () => {
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt());
    const preparedCalls = await prepareCalls({
      kind: 'calls.wallet',
      review: {
        requiresDelegationAuthorization: false,
        transactions: [],
      },
    });

    mockExecuteCalls.mockResolvedValue({
      kind: 'calls.wallet',
      transactions: [
        {
          hash: TX_HASH,
          transaction: {
            data: STAKE_CALL.data,
            gas: 21000n,
            maxFeePerGas: 1n,
            maxPriorityFeePerGas: 1n,
            nonce: 1,
            to: STAKING_CONTRACT_ADDRESS,
            value: 0n,
          },
          type: 'eip1559',
        },
      ],
    });

    const result = await executeStakeRnbw({
      address: ACCOUNT,
      asset: rnbwAsset,
      gasParams: GAS_PARAMS,
      preparedCalls,
      provider,
      signer,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    expect(result.executionMode).toBe('manual');
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: expect.objectContaining({ hash: TX_HASH }),
      transaction: expect.objectContaining({ type: 'stake' }),
    });
    expect(mockExecuteCalls).toHaveBeenCalledWith(preparedCalls, {
      chainId: STAKING_CHAIN_ID,
      provider,
      signer,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('executes sponsored staking through the managed relay and waits through relay status', async () => {
    const preparedCalls = await prepareCalls({
      executionId: 'prepared-stake',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    mockExecuteCalls.mockResolvedValue({
      executionId: 'submitted-stake',
      kind: 'calls.managed',
      status: 'PENDING',
    });

    const result = await executeStakeRnbw({
      address: ACCOUNT,
      asset: rnbwAsset,
      gasParams: GAS_PARAMS,
      preparedCalls,
      provider,
      signer,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    expect(result.executionMode).toBe('sponsored');
    expect(mockExecuteCalls).toHaveBeenCalledWith(preparedCalls, {
      chainId: STAKING_CHAIN_ID,
      provider,
      signer,
    });
    expect(mockResolveManagedExecutionFailure).toHaveBeenCalledWith({
      executionId: 'submitted-stake',
      status: 'PENDING',
    });
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: {
        executionId: 'submitted-stake',
        kind: 'calls.managed',
        status: 'PENDING',
      },
      transaction: expect.objectContaining({
        asset: expect.objectContaining({
          address: RNBW_TOKEN_ADDRESS,
          network: 'Base',
          symbol: 'RNBW',
          uniqueId: RNBW_TOKEN_UNIQUE_ID,
        }),
        chainId: STAKING_CHAIN_ID,
        changes: [
          expect.objectContaining({
            address_from: ACCOUNT,
            address_to: STAKING_CONTRACT_ADDRESS,
            direction: TransactionDirection.OUT,
            price: 1,
            value: STAKE_AMOUNT_RAW,
          }),
        ],
        from: ACCOUNT,
        network: 'Base',
        nonce: -1,
        status: TransactionStatus.pending,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'stake',
        value: 0,
      }),
    });

    await result.waitForConfirmation();

    expect(mockWaitForManagedExecutionConfirmation).toHaveBeenCalledWith('submitted-stake');
  });

  it('builds one raw exact-call plan when software-wallet submission has no prepared calls', async () => {
    mockBuildStakeRnbwExecutionPlan.mockResolvedValue(SPONSORED_PLAN);
    mockExecuteCalls.mockResolvedValue({
      executionId: 'raw-stake',
      kind: 'calls.managed',
      status: 'PENDING',
    });

    const result = await executeStakeRnbw({
      address: ACCOUNT,
      asset: rnbwAsset,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    expect(result.executionMode).toBe('sponsored');
    expect(mockExecuteCalls).toHaveBeenCalledWith(
      {
        calls: [APPROVAL_CALL, STAKE_CALL],
        chainId: STAKING_CHAIN_ID,
        provider,
        requirements: SPONSORED_REQUIREMENTS,
        signer,
      },
      undefined
    );
  });

  it('uses selected gas params, estimates call gas, and waits for hardware-wallet approval before staking', async () => {
    const hardwareSigner = new TestHardwareSigner(provider);
    const approvalConfirmation = defer<TransactionReceipt>();
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockImplementation(hash => {
      if (hash === APPROVAL_TX_HASH) return approvalConfirmation.promise;
      return Promise.resolve(buildReceipt(hash));
    });
    jest
      .spyOn(provider, 'estimateGas')
      .mockRejectedValueOnce(new Error('approval estimate failed'))
      .mockResolvedValueOnce(ESTIMATED_STAKE_GAS_LIMIT);

    mockBuildStakeRnbwCalls.mockResolvedValue([APPROVAL_CALL, STAKE_CALL]);
    mockSubmittedTransactions(hardwareSigner, [
      { hash: APPROVAL_TX_HASH, nonce: 1 },
      { hash: TX_HASH, nonce: 2 },
    ]);

    const execution = executeStakeRnbw({
      address: ACCOUNT,
      asset: rnbwAsset,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer: hardwareSigner,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    await waitForMockCalls(waitForTransaction, 1);

    expect(hardwareSigner.sendTransactionMock).toHaveBeenCalledTimes(1);
    await expect(submittedRequest(hardwareSigner, 1)).resolves.toMatchObject({
      to: RNBW_TOKEN_ADDRESS,
      value: 0n,
      gasLimit: STAKING_APPROVAL_GAS_LIMIT,
      ...GAS_PARAMS,
    });
    expect(waitForTransaction).toHaveBeenCalledWith(APPROVAL_TX_HASH, 1, time.minutes(2));

    approvalConfirmation.resolve(buildReceipt(APPROVAL_TX_HASH));
    const result = await execution;

    expect(mockExecuteCalls).not.toHaveBeenCalled();
    expect(result.executionMode).toBe('manual');
    expect(mockAddNewTransaction).toHaveBeenCalledWith({
      address: ACCOUNT,
      chainId: STAKING_CHAIN_ID,
      transaction: expect.objectContaining({
        hash: TX_HASH,
        gasLimit: ESTIMATED_STAKE_GAS_LIMIT,
        nonce: 2,
        type: 'stake',
      }),
    });
    await expect(submittedRequest(hardwareSigner, 2)).resolves.toMatchObject({
      to: STAKING_CONTRACT_ADDRESS,
      value: 0n,
      gasLimit: ESTIMATED_STAKE_GAS_LIMIT,
      ...GAS_PARAMS,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledTimes(2);
    expect(waitForTransaction).toHaveBeenLastCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('submits one hardware-wallet stake transaction when approval is not required', async () => {
    const hardwareSigner = new TestHardwareSigner(provider);
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt(TX_HASH));
    jest.spyOn(provider, 'estimateGas').mockResolvedValue(ESTIMATED_STAKE_GAS_LIMIT);

    mockBuildStakeRnbwCalls.mockResolvedValue([STAKE_CALL]);
    mockSubmittedTransactions(hardwareSigner, [{ hash: TX_HASH, nonce: 2 }]);

    const execution = await executeStakeRnbw({
      address: ACCOUNT,
      asset: rnbwAsset,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer: hardwareSigner,
      stakeAmountRaw: STAKE_AMOUNT_RAW,
    });

    expect(hardwareSigner.sendTransactionMock).toHaveBeenCalledTimes(1);
    await expect(submittedRequest(hardwareSigner, 1)).resolves.toMatchObject({
      to: STAKING_CONTRACT_ADDRESS,
      value: 0n,
      gasLimit: ESTIMATED_STAKE_GAS_LIMIT,
      ...GAS_PARAMS,
    });
    expect(waitForTransaction).not.toHaveBeenCalled();

    await execution.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });
});
