import type { Provider, TransactionReceipt, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';
import { resolveProperties, type Deferrable } from '@ethersproject/properties';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { encodeFunctionData, type Address } from 'viem';

import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { TransactionDirection, TransactionStatus } from '@/entities/transactions';
import { time } from '@/framework/core/utils/time';

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

const mockBuildSyntheticRnbwSourceAsset = jest.fn<ExtendedAnimatedAssetWithColors | null, []>();
const mockAddNewTransaction = jest.fn<void, [unknown]>();

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

describe('executeUnstakeRnbw', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockBuildSyntheticRnbwSourceAsset.mockReturnValue(rnbwAsset);
    jest.spyOn(provider, 'estimateGas').mockResolvedValue(BigNumber.from(ESTIMATED_GAS_LIMIT));
  });

  it('submits the unstakeAll transaction directly and registers the pending transaction', async () => {
    const waitForTransaction = jest.spyOn(provider, 'waitForTransaction').mockResolvedValue(buildReceipt(TX_HASH));
    const sendTransaction = jest
      .spyOn(signer, 'sendTransaction')
      .mockImplementationOnce(transaction => buildTransactionResponse({ hash: TX_HASH, nonce: 1, transaction }));

    const result = await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
      provider,
      signer,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(provider.estimateGas).toHaveBeenCalledWith({
      data: UNSTAKE_ALL_DATA,
      from: ACCOUNT,
      to: STAKING_CONTRACT_ADDRESS,
    });
    await expect(resolveProperties(sendTransaction.mock.calls[0][0])).resolves.toMatchObject({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: ESTIMATED_GAS_LIMIT,
    });
    expect(mockAddNewTransaction).toHaveBeenCalledWith({
      address: ACCOUNT,
      chainId: STAKING_CHAIN_ID,
      transaction: expect.objectContaining({
        asset: expect.objectContaining({
          address: RNBW_TOKEN_ADDRESS,
          chainId: STAKING_CHAIN_ID,
          decimals: RNBW_DECIMALS,
          isNativeAsset: false,
          name: 'Rainbow',
          symbol: 'RNBW',
          uniqueId: RNBW_TOKEN_UNIQUE_ID,
        }),
        changes: [
          expect.objectContaining({
            address_from: STAKING_CONTRACT_ADDRESS,
            address_to: ACCOUNT,
            direction: TransactionDirection.IN,
            value: EXPECTED_RECEIVE_AMOUNT_RAW,
          }),
        ],
        data: UNSTAKE_ALL_DATA,
        from: ACCOUNT,
        gasLimit: BigNumber.from(ESTIMATED_GAS_LIMIT),
        hash: TX_HASH,
        nonce: 1,
        status: TransactionStatus.pending,
        to: STAKING_CONTRACT_ADDRESS,
        type: 'unstake',
      }),
    });
    expect(waitForTransaction).not.toHaveBeenCalled();

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
      provider,
      signer: hardwareSigner,
    });

    expect(result.executionMode).toBe('manual');
    expect(result.txHash).toBe(TX_HASH);
    expect(hardwareSigner.sendTransactionMock).toHaveBeenCalledTimes(1);
    await expect(resolveProperties(hardwareSigner.sendTransactionMock.mock.calls[0][0])).resolves.toMatchObject({
      ...GAS_PARAMS,
      to: STAKING_CONTRACT_ADDRESS,
      data: UNSTAKE_ALL_DATA,
      gasLimit: ESTIMATED_GAS_LIMIT,
    });

    await result.waitForConfirmation();

    expect(waitForTransaction).toHaveBeenCalledWith(TX_HASH, 1, time.minutes(2));
  });

  it('uses the fallback gas limit when unstake gas estimation fails', async () => {
    jest.spyOn(provider, 'estimateGas').mockRejectedValueOnce(new Error('estimate failed'));
    const sendTransaction = jest
      .spyOn(signer, 'sendTransaction')
      .mockImplementationOnce(transaction => buildTransactionResponse({ hash: TX_HASH, nonce: 1, transaction }));

    await executeUnstakeRnbw({
      address: ACCOUNT,
      expectedReceiveAmountRaw: EXPECTED_RECEIVE_AMOUNT_RAW,
      gasParams: GAS_PARAMS,
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
