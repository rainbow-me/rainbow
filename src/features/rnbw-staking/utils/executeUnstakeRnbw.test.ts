import type { Provider, TransactionReceipt, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';
import { resolveProperties, type Deferrable } from '@ethersproject/properties';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { encodeFunctionData, type Address } from 'viem';

import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { time } from '@/framework/core/utils/time';
import { execute, type Call, type CallsRequirements, type PreparedCallsExecution } from '@rainbow-me/delegation';

import {
  RNBW_DECIMALS,
  RNBW_TOKEN_ADDRESS,
  RNBW_TOKEN_UNIQUE_ID,
  STAKING_ABI,
  STAKING_CHAIN_ID,
  STAKING_CONTRACT_ADDRESS,
  STAKING_UNSTAKE_GAS_LIMIT,
} from '../constants';
import { executeUnstakeRnbw } from './executeUnstakeRnbw';

const mockExecuteCalls = jest.fn<Promise<unknown>, [unknown, unknown?]>();
const mockPrepareCalls = jest.fn<Promise<unknown>, [unknown]>();
const mockBuildUnstakeRnbwExecutionPlan = jest.fn<Promise<{ calls: Call[]; requirements?: CallsRequirements }>, [unknown]>();
const mockCanUseDelegatedExecution = jest.fn<boolean, [Address]>();
const mockResolveManagedExecutionFailure = jest.fn<Promise<string | null>, [unknown]>();
const mockTrackCallsExecution = jest.fn<void, [unknown]>();
const mockWaitForManagedExecutionConfirmation = jest.fn<Promise<void>, [string]>();
const mockBuildSyntheticRnbwSourceAsset = jest.fn<ExtendedAnimatedAssetWithColors | null, []>();
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

jest.mock('@/features/delegation/utils/managedExecutionFailure', () => ({
  resolveManagedExecutionFailure: (params: unknown) => mockResolveManagedExecutionFailure(params),
}));

jest.mock('@/features/delegation/utils/callsExecutionTracking', () => ({
  trackCallsExecution: (params: unknown) => mockTrackCallsExecution(params),
}));

jest.mock('@/features/delegation/utils/waitForManagedExecution', () => ({
  waitForManagedExecutionConfirmation: (executionId: string) => mockWaitForManagedExecutionConfirmation(executionId),
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: (params: unknown) => mockAddNewTransaction(params),
}));

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: {
    getChainsName: () => ({ 8453: 'Base' }),
  },
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

jest.mock('./unstakeRnbwCalls', () => ({
  buildUnstakeRnbwExecutionPlan: (params: unknown) => mockBuildUnstakeRnbwExecutionPlan(params),
}));

jest.mock('@/features/delegation/utils/willDelegate', () => ({
  canUseDelegatedExecution: (address: Address) => mockCanUseDelegatedExecution(address),
}));

jest.mock('./syntheticRnbwSourceAsset', () => ({
  buildSyntheticRnbwSourceAsset: () => mockBuildSyntheticRnbwSourceAsset(),
}));

const ACCOUNT: Address = '0x3333333333333333333333333333333333333333';
const PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
const EXPECTED_RECEIVE_AMOUNT_RAW = '950000000000000000000';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const UNSTAKE_ALL_DATA = encodeFunctionData({ abi: STAKING_ABI, functionName: 'unstakeAll' });
const GAS_PARAMS = { maxFeePerGas: '10', maxPriorityFeePerGas: '1' };
const ESTIMATED_GAS_LIMIT = '123456';

const UNSTAKE_CALL: Call = { data: UNSTAKE_ALL_DATA, to: STAKING_CONTRACT_ADDRESS, value: 0n };
const provider = new StaticJsonRpcProvider('http://127.0.0.1:8545', STAKING_CHAIN_ID);
const signer = new Wallet(PRIVATE_KEY, provider);

class TestHardwareSigner extends Signer {
  readonly provider: Provider;
  readonly sendTransactionMock = jest.fn<Promise<TransactionResponse>, [Deferrable<TransactionRequest>]>();

  constructor(provider: Provider) {
    super();
    this.provider = provider;
  }

  connect(): Signer {
    return new TestHardwareSigner(this.provider);
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
} as unknown as ExtendedAnimatedAssetWithColors;

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

async function prepareCalls(plan: unknown): Promise<PreparedCallsExecution> {
  mockPrepareCalls.mockResolvedValueOnce(plan);
  return execute.prepare.calls({
    calls: [UNSTAKE_CALL],
    chainId: STAKING_CHAIN_ID,
    provider,
    signer,
  });
}

describe('executeUnstakeRnbw', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockBuildUnstakeRnbwExecutionPlan.mockResolvedValue({ calls: [UNSTAKE_CALL] });
    mockCanUseDelegatedExecution.mockReturnValue(true);
    mockResolveManagedExecutionFailure.mockResolvedValue(null);
    mockWaitForManagedExecutionConfirmation.mockResolvedValue();
    mockBuildSyntheticRnbwSourceAsset.mockReturnValue(rnbwAsset);
    jest.spyOn(provider, 'estimateGas').mockResolvedValue(BigNumber.from(ESTIMATED_GAS_LIMIT));
  });

  it('tracks wallet exact-call execution when prepared calls resolve to a wallet-paid transaction', async () => {
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
            data: UNSTAKE_ALL_DATA,
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

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls,
      provider,
      signer,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: expect.objectContaining({ hash: TX_HASH }),
      transaction: expect.objectContaining({
        from: ACCOUNT,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'unstake',
      }),
    });
    expect(mockExecuteCalls).toHaveBeenCalledWith(preparedCalls, {
      chainId: STAKING_CHAIN_ID,
      provider,
      signer,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('executes sponsored unstaking through the managed relay and waits through relay status', async () => {
    const preparedCalls = await prepareCalls({
      executionId: 'prepared-unstake',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    mockExecuteCalls.mockResolvedValue({
      executionId: 'submitted-unstake',
      kind: 'calls.managed',
      status: 'PENDING',
    });

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls,
      provider,
      signer,
    });

    expect(result.executionMode).toBe('sponsored');
    expect(result.executionId).toBe('submitted-unstake');
    expect(result.txHash).toBeUndefined();
    expect(mockExecuteCalls).toHaveBeenCalledWith(preparedCalls, {
      chainId: STAKING_CHAIN_ID,
      provider,
      signer,
    });
    expect(mockResolveManagedExecutionFailure).toHaveBeenCalledWith({
      executionId: 'submitted-unstake',
      status: 'PENDING',
    });
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: {
        executionId: 'submitted-unstake',
        kind: 'calls.managed',
        status: 'PENDING',
      },
      transaction: expect.objectContaining({
        from: ACCOUNT,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'unstake',
      }),
    });

    await result.waitForConfirmation();

    expect(mockWaitForManagedExecutionConfirmation).toHaveBeenCalledWith('submitted-unstake');
  });

  it('tracks the managed relay failure and throws when sponsored execution reports failure', async () => {
    const preparedCalls = await prepareCalls({
      executionId: 'prepared-unstake',
      kind: 'calls.managed',
      review: { fees: { payer: 'sponsor' } },
    });

    mockExecuteCalls.mockResolvedValue({
      executionId: 'submitted-unstake',
      kind: 'calls.managed',
      status: 'FAILED',
    });
    mockResolveManagedExecutionFailure.mockResolvedValue('relay reported failure');

    await expect(
      executeUnstakeRnbw({
        address: ACCOUNT,
        expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
        gasParams: GAS_PARAMS,
        preparedCalls,
        provider,
        signer,
      })
    ).rejects.toThrow('[executeUnstakeRnbw]: relay reported failure');
    expect(mockTrackCallsExecution).not.toHaveBeenCalled();
  });

  it('executes unstaking through wallet exact calls when prepared calls are unavailable', async () => {
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt(TX_HASH));
    mockExecuteCalls.mockResolvedValue({
      kind: 'calls.wallet',
      transactions: [
        {
          hash: TX_HASH,
          transaction: {
            data: UNSTAKE_ALL_DATA,
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

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(mockBuildUnstakeRnbwExecutionPlan).toHaveBeenCalledWith({ address: ACCOUNT });
    expect(mockExecuteCalls).toHaveBeenCalledWith(
      {
        calls: [UNSTAKE_CALL],
        chainId: STAKING_CHAIN_ID,
        provider,
        signer,
      },
      undefined
    );
    expect(mockTrackCallsExecution).toHaveBeenCalledWith({
      address: ACCOUNT,
      batch: false,
      chainId: STAKING_CHAIN_ID,
      execution: expect.objectContaining({ hash: TX_HASH }),
      transaction: expect.objectContaining({
        from: ACCOUNT,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'unstake',
      }),
    });
    expect(provider.estimateGas).not.toHaveBeenCalled();
    expect(mockAddNewTransaction).not.toHaveBeenCalled();
    expect(waitForTransaction).not.toHaveBeenCalled();

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('submits the unstakeAll transaction directly when delegation is unavailable', async () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt(TX_HASH));
    const sendTransaction = jest
      .spyOn(signer, 'sendTransaction')
      .mockImplementationOnce(transaction => buildTransactionResponse({ hash: TX_HASH, nonce: 1, transaction }));

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(mockExecuteCalls).not.toHaveBeenCalled();
    expect(mockTrackCallsExecution).not.toHaveBeenCalled();
    await expect(resolveProperties(sendTransaction.mock.calls[0][0])).resolves.toMatchObject({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: ESTIMATED_GAS_LIMIT,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('submits the unstakeAll transaction directly for hardware wallets', async () => {
    const hardwareSigner = new TestHardwareSigner(provider);
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt(TX_HASH));
    hardwareSigner.sendTransactionMock.mockImplementation(transaction => buildTransactionResponse({ transaction }));

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer: hardwareSigner,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(mockExecuteCalls).not.toHaveBeenCalled();
    expect(hardwareSigner.sendTransactionMock).toHaveBeenCalledTimes(1);
    expect(mockTrackCallsExecution).not.toHaveBeenCalled();
    await expect(resolveProperties(hardwareSigner.sendTransactionMock.mock.calls[0][0])).resolves.toMatchObject({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: ESTIMATED_GAS_LIMIT,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('uses the fallback gas limit when manual unstake gas estimation fails', async () => {
    mockCanUseDelegatedExecution.mockReturnValue(false);
    jest.spyOn(provider, 'estimateGas').mockRejectedValueOnce(new Error('estimate failed'));
    const sendTransaction = jest
      .spyOn(signer, 'sendTransaction')
      .mockImplementationOnce(transaction => buildTransactionResponse({ hash: TX_HASH, nonce: 1, transaction }));

    await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      preparedCalls: null,
      provider,
      signer,
    });

    await expect(resolveProperties(sendTransaction.mock.calls[0][0])).resolves.toMatchObject({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: STAKING_UNSTAKE_GAS_LIMIT.toString(),
    });
  });
});
