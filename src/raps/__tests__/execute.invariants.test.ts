import { VoidSigner } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';
import { UserRejectedRequestError } from 'viem';
import { ChainId } from '@/state/backendNetworks/types';
import { walletExecuteRap } from '../execute';
import { createSwapAction, createSwapRapParameters, TEST_ALLOWANCE_TARGET, TEST_OWNER_ADDRESS } from './fixtures';

jest.mock('@rainbow-me/delegation', () => ({
  executeBatchedTransaction: jest.fn(),
  supportsDelegation: jest.fn(),
}));

jest.mock('@/state/performance/performance', () => ({
  Screens: { SWAPS: 'SWAPS' },
  TimeToSignOperation: {
    CreateRap: 'CreateRap',
    BroadcastTransaction: 'BroadcastTransaction',
  },
  executeFn: jest.fn(),
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: jest.fn(() => ({ degenMode: false })),
  },
}));

jest.mock('@/systems/delegation/featureFlags', () => ({
  isDelegationEnabled: jest.fn(),
}));

jest.mock('@/config/experimental', () => ({
  DELEGATION: 'delegation',
  getExperimentalFlag: jest.fn(() => false),
}));

jest.mock('@/model/remoteConfig', () => ({
  getRemoteConfig: jest.fn(() => ({
    delegation_enabled: true,
  })),
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: jest.fn(),
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: jest.fn(),
}));

jest.mock('../actions', () => ({
  claim: jest.fn(),
  swap: jest.fn(),
  unlock: jest.fn(),
}));

jest.mock('../actions/crosschainSwap', () => ({
  crosschainSwap: jest.fn(),
  prepareCrosschainSwap: jest.fn(),
}));

jest.mock('../actions/claimBridge', () => ({
  claimBridge: jest.fn(),
}));

jest.mock('../actions/claimClaimable', () => ({
  claimClaimable: jest.fn(),
}));

jest.mock('../actions/swap', () => ({
  prepareSwap: jest.fn(),
}));

jest.mock('../actions/unlock', () => ({
  prepareUnlock: jest.fn(),
}));

jest.mock('../unlockAndSwap', () => ({
  createUnlockAndSwapRap: jest.fn(),
}));

jest.mock('../unlockAndCrosschainSwap', () => ({
  createUnlockAndCrosschainSwapRap: jest.fn(),
}));

jest.mock('../claimAndBridge', () => ({
  createClaimAndBridgeRap: jest.fn(),
}));

jest.mock('../claimClaimable', () => ({
  createClaimClaimableRap: jest.fn(),
}));

const SEQUENTIAL_HASH = '0xsequential';
const ATOMIC_HASH = '0xatomic';

const delegationModule = jest.requireMock('@rainbow-me/delegation');
const performanceModule = jest.requireMock('@/state/performance/performance');
const delegationFlagsModule = jest.requireMock('@/systems/delegation/featureFlags');
const web3Module = jest.requireMock('@/handlers/web3');
const pendingTransactionsModule = jest.requireMock('@/state/pendingTransactions');
const actionsModule = jest.requireMock('../actions');
const swapActionModule = jest.requireMock('../actions/swap');
const unlockAndSwapModule = jest.requireMock('../unlockAndSwap');

const mockExecuteBatchedTransaction = delegationModule.executeBatchedTransaction;
const mockSupportsDelegation = delegationModule.supportsDelegation;
const mockExecuteFn = performanceModule.executeFn;
const mockIsDelegationEnabled = delegationFlagsModule.isDelegationEnabled;
const mockGetProvider = web3Module.getProvider;
const mockAddNewTransaction = pendingTransactionsModule.addNewTransaction;
const mockSwap = actionsModule.swap;
const mockPrepareSwap = swapActionModule.prepareSwap;
const mockCreateUnlockAndSwapRap = unlockAndSwapModule.createUnlockAndSwapRap;

function createWallet() {
  return new Wallet('0x59c6995e998f97a5a0044966f0945382d9f4f95f5e7e1c8f3f6f2f1a6a6f7c89');
}

function setupExecuteHarness() {
  jest.clearAllMocks();

  mockExecuteFn.mockImplementation((fn: (...args: unknown[]) => unknown) => fn);
  mockIsDelegationEnabled.mockReturnValue(true);
  mockSupportsDelegation.mockResolvedValue({ supported: true, reason: null });

  mockExecuteBatchedTransaction.mockResolvedValue({
    hash: ATOMIC_HASH,
    type: 'eip7702',
    transaction: {
      to: TEST_OWNER_ADDRESS,
      data: '0xbatched',
      value: 0n,
      gas: 101n,
    },
  });

  mockGetProvider.mockReturnValue({ chainId: ChainId.mainnet });

  mockCreateUnlockAndSwapRap.mockResolvedValue({
    actions: [createSwapAction()],
  });

  mockSwap.mockResolvedValue({
    nonce: 42,
    hash: SEQUENTIAL_HASH,
  });

  mockPrepareSwap.mockResolvedValue({
    call: {
      to: TEST_ALLOWANCE_TARGET,
      data: '0x1234',
      value: '0x0',
    },
    transaction: {
      from: TEST_OWNER_ADDRESS,
      to: TEST_ALLOWANCE_TARGET,
      chainId: ChainId.mainnet,
      type: 'swap',
      status: 'pending',
    },
  });
}

describe('walletExecuteRap invariants', () => {
  beforeEach(() => {
    setupExecuteHarness();
  });

  test('falls back to sequential execution when nonce is missing', async () => {
    const parameters = createSwapRapParameters({ nonce: undefined, atomic: true });

    const result = await walletExecuteRap(createWallet(), 'swap', parameters);

    expect(mockExecuteBatchedTransaction).not.toHaveBeenCalled();
    expect(mockSwap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      errorMessage: null,
      hash: SEQUENTIAL_HASH,
      nonce: 42,
    });
  });

  test('falls back to sequential execution on non-user-rejection atomic errors', async () => {
    mockExecuteBatchedTransaction.mockRejectedValue(new Error('RPC invalid params'));

    const result = await walletExecuteRap(createWallet(), 'swap', createSwapRapParameters({ nonce: 7, atomic: true }));

    expect(mockExecuteBatchedTransaction).toHaveBeenCalledTimes(1);
    expect(mockSwap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      errorMessage: null,
      hash: SEQUENTIAL_HASH,
      nonce: 42,
    });
  });

  test('does not fall back to sequential execution on explicit user rejection', async () => {
    const rejection = Object.assign(new Error('User rejected transaction'), {
      code: UserRejectedRequestError.code,
      name: UserRejectedRequestError.name,
    });
    mockExecuteBatchedTransaction.mockRejectedValue(rejection);

    const result = await walletExecuteRap(createWallet(), 'swap', createSwapRapParameters({ nonce: 9, atomic: true }));

    expect(mockExecuteBatchedTransaction).toHaveBeenCalledTimes(1);
    expect(mockSwap).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: 'User rejected transaction',
      hash: null,
      nonce: undefined,
    });
  });

  test('falls back to sequential execution for non-software signers', async () => {
    const signer = new VoidSigner(TEST_OWNER_ADDRESS);

    const result = await walletExecuteRap(signer, 'swap', createSwapRapParameters({ nonce: 11, atomic: true }));

    expect(mockExecuteBatchedTransaction).not.toHaveBeenCalled();
    expect(mockSwap).toHaveBeenCalledTimes(1);
    expect(result.hash).toBe(SEQUENTIAL_HASH);
    expect(result.errorMessage).toBeNull();
  });

  test('uses atomic execution and records pending transaction metadata when eligible', async () => {
    const parameters = createSwapRapParameters({ nonce: 12, atomic: true });

    const result = await walletExecuteRap(createWallet(), 'swap', parameters);

    expect(mockExecuteBatchedTransaction).toHaveBeenCalledTimes(1);
    expect(mockSwap).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: null,
      hash: ATOMIC_HASH,
      nonce: 12,
    });

    const [atomicRequest] = mockExecuteBatchedTransaction.mock.calls[0];
    expect(atomicRequest.transactionOptions.gasLimit).toBeNull();
    expect(atomicRequest.nonce).toBe(12);

    expect(mockAddNewTransaction).toHaveBeenCalledTimes(1);
    const [pendingTransactionPayload] = mockAddNewTransaction.mock.calls[0];
    expect(pendingTransactionPayload.address).toBe(parameters.quote.from);
    expect(pendingTransactionPayload.chainId).toBe(parameters.chainId);
    expect(pendingTransactionPayload.transaction.hash).toBe(ATOMIC_HASH);
    expect(pendingTransactionPayload.transaction.batch).toBe(true);
    expect(pendingTransactionPayload.transaction.delegation).toBe(true);
    expect(pendingTransactionPayload.transaction.to).toBe(TEST_OWNER_ADDRESS);
    expect(pendingTransactionPayload.transaction.data).toBe('0xbatched');
    expect(pendingTransactionPayload.transaction.value).toBe('0');
  });
});
