import { Wallet } from '@ethersproject/wallet';
import { executeBatchedTransaction, supportsDelegation } from '@rainbow-me/delegation';

import { DELEGATION, getExperimentalFlag } from '@/config/experimental';
import { getRemoteConfig } from '@/model/remoteConfig';
import { ChainId } from '@/state/backendNetworks/types';
import { addNewTransaction } from '@/state/pendingTransactions';

import { swap } from '../actions';
import { crosschainSwap, prepareCrosschainSwap } from '../actions/crosschainSwap';
import { prepareSwap } from '../actions/swap';
import { prepareUnlock } from '../actions/unlock';
import { walletExecuteRap } from '../execute';
import { createUnlockAndCrosschainSwapRap } from '../unlockAndCrosschainSwap';
import { createUnlockAndSwapRap } from '../unlockAndSwap';

jest.mock('@/env', () => ({ IS_TEST: false }));

jest.mock('@rainbow-me/delegation', () => ({
  executeBatchedTransaction: jest.fn(),
  supportsDelegation: jest.fn(),
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: jest.fn(),
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: jest.fn(() => ({ id: 'provider' })),
}));

jest.mock('@/config/experimental', () => ({
  DELEGATION: 'DELEGATION',
  getExperimentalFlag: jest.fn(),
}));

jest.mock('@/model/remoteConfig', () => ({
  getRemoteConfig: jest.fn(),
}));

jest.mock('@/state/performance/performance', () => ({
  Screens: { SWAPS: 'SWAPS' },
  TimeToSignOperation: {
    BroadcastTransaction: 'BroadcastTransaction',
    CreateRap: 'CreateRap',
  },
  executeFn: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: () => ({ degenMode: false }),
  },
}));

jest.mock('../actions', () => ({
  claim: jest.fn(),
  swap: jest.fn(),
  unlock: jest.fn(),
}));

jest.mock('../actions/claimBridge', () => ({
  claimBridge: jest.fn(),
}));

jest.mock('../actions/claimClaimable', () => ({
  claimClaimable: jest.fn(),
}));

jest.mock('../actions/unlock', () => ({
  prepareUnlock: jest.fn(),
}));

jest.mock('../actions/swap', () => ({
  prepareSwap: jest.fn(),
}));

jest.mock('../actions/crosschainSwap', () => ({
  crosschainSwap: jest.fn(),
  prepareCrosschainSwap: jest.fn(),
}));

jest.mock('../claimAndBridge', () => ({
  createClaimAndBridgeRap: jest.fn(),
}));

jest.mock('../claimClaimable', () => ({
  createClaimClaimableRap: jest.fn(),
}));

jest.mock('../unlockAndSwap', () => ({
  createUnlockAndSwapRap: jest.fn(),
}));

jest.mock('../unlockAndCrosschainSwap', () => ({
  createUnlockAndCrosschainSwapRap: jest.fn(),
}));

const FROM = '0x1111111111111111111111111111111111111111';
const TARGET = '0x2222222222222222222222222222222222222222';
const ALT_TARGET = '0x3333333333333333333333333333333333333333';

const atomicGasParams = {
  maxFeePerGas: '10',
  maxPriorityFeePerGas: '2',
};

const gasFeeParamsBySpeed = {
  fast: {
    maxFeePerGas: { amount: '10' },
    maxPriorityFeePerGas: { amount: '2' },
  },
};

const makeSwapParameters = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  atomic: true,
  nonce: 9,
  chainId: ChainId.mainnet,
  sellAmount: '1',
  assetToSell: { chainId: ChainId.mainnet },
  assetToBuy: { chainId: ChainId.mainnet },
  gasParams: atomicGasParams,
  gasFeeParamsBySpeed,
  quote: {
    from: FROM,
    to: TARGET,
    data: '0xaaa',
    value: '0x0',
  },
  ...overrides,
});

const makeSwapAction = (nonce: number | undefined = 9) => ({
  type: 'swap',
  transaction: { hash: null },
  parameters: {
    ...makeSwapParameters({ nonce }),
  },
});

const makeCrosschainParameters = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  ...makeSwapParameters(),
  quote: {
    from: FROM,
    to: TARGET,
    data: '0xbbb',
    value: '0x0',
  },
  ...overrides,
});

const makeCrosschainAction = (nonce: number | undefined = 9) => ({
  type: 'crosschainSwap',
  transaction: { hash: null },
  parameters: {
    ...makeCrosschainParameters({ nonce }),
  },
});

const makePreparedTransaction = (nonce: number) => ({
  nonce,
  chainId: ChainId.mainnet,
  from: FROM,
  to: TARGET,
  data: '0xdead',
  value: '0x0',
  gasLimit: '21000',
  network: 'Ethereum',
  status: 'pending',
  type: 'swap',
  changes: [],
});

describe('walletExecuteRap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getRemoteConfig as jest.Mock).mockReturnValue({ delegation_enabled: true });
    (getExperimentalFlag as jest.Mock).mockImplementation(flag => flag === DELEGATION && false);
    (supportsDelegation as jest.Mock).mockResolvedValue({ supported: true, reason: null });
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({ actions: [makeSwapAction()] });
    (createUnlockAndCrosschainSwapRap as jest.Mock).mockResolvedValue({ actions: [makeCrosschainAction()] });
    (prepareUnlock as jest.Mock).mockResolvedValue({
      call: { to: ALT_TARGET, value: '0x0', data: '0x0' },
    });
    (prepareSwap as jest.Mock).mockResolvedValue({
      call: { to: TARGET, value: '0x0', data: '0xaaa' },
      transaction: makePreparedTransaction(9),
    });
    (prepareCrosschainSwap as jest.Mock).mockResolvedValue({
      call: { to: TARGET, value: '0x0', data: '0xbbb' },
      transaction: {
        ...makePreparedTransaction(9),
        type: 'bridge',
      },
    });
    (executeBatchedTransaction as jest.Mock).mockResolvedValue({
      hash: '0xatomic',
      type: 'eip7702',
    });
    (swap as jest.Mock).mockResolvedValue({
      nonce: 9,
      hash: '0xsequential',
    });
    (crosschainSwap as jest.Mock).mockResolvedValue({
      nonce: 9,
      hash: '0xsequentialCrosschain',
    });
  });

  it('executes atomic swaps and stores delegation=true for eip7702 batches', async () => {
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({
      actions: [
        {
          type: 'unlock',
          transaction: { hash: null },
          parameters: {
            chainId: ChainId.mainnet,
            amount: '1',
            fromAddress: FROM,
            contractAddress: ALT_TARGET,
            assetToUnlock: { chainId: ChainId.mainnet },
          },
        },
        makeSwapAction(13),
      ],
    });
    (prepareSwap as jest.Mock).mockResolvedValue({
      call: { to: TARGET, value: '0x0', data: '0xaaa' },
      transaction: makePreparedTransaction(13),
    });

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters({ nonce: 13 }) as never);

    expect(prepareSwap).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: expect.objectContaining({ nonce: 13 }),
      })
    );

    expect(addNewTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: FROM,
        chainId: ChainId.mainnet,
        transaction: expect.objectContaining({
          nonce: 13,
          hash: '0xatomic',
          batch: true,
          delegation: true,
        }),
      })
    );

    expect(result).toEqual({
      errorMessage: null,
      hash: '0xatomic',
      nonce: 13,
    });
  });

  it('stores delegation=false when atomic execution is not eip7702', async () => {
    (executeBatchedTransaction as jest.Mock).mockResolvedValue({
      hash: '0xatomic-not-7702',
      type: 'transaction',
    });

    await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters() as never);

    expect(addNewTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          hash: '0xatomic-not-7702',
          batch: true,
          delegation: false,
        }),
      })
    );
  });

  it('falls back to sequential swap when delegation support is unavailable', async () => {
    (supportsDelegation as jest.Mock).mockResolvedValue({ supported: false, reason: 'UNSUPPORTED_CHAIN' });
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({ actions: [makeSwapAction(21)] });
    (swap as jest.Mock).mockResolvedValue({ nonce: 21, hash: '0xsequential-unsupported' });

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters({ nonce: 21 }) as never);

    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(swap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-unsupported',
      nonce: 21,
    });
  });

  it('runs sequential swap when atomic is not requested', async () => {
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({ actions: [makeSwapAction(17)] });
    (swap as jest.Mock).mockResolvedValue({ nonce: 17, hash: '0xsequential-non-atomic' });

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters({ atomic: false, nonce: 17 }) as never);

    expect(supportsDelegation).not.toHaveBeenCalled();
    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-non-atomic',
      nonce: 17,
    });
  });

  it('does not fall back to sequential execution when user rejects atomic signing', async () => {
    (executeBatchedTransaction as jest.Mock).mockRejectedValue(
      Object.assign(new Error('User rejected'), {
        code: 4001,
        name: 'UserRejectedRequestError',
      })
    );

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters() as never);

    expect(swap).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: 'User rejected',
      hash: null,
      nonce: undefined,
    });
  });

  it('runs atomic crosschain swaps with nonce forwarded into prepareCrosschainSwap', async () => {
    (createUnlockAndCrosschainSwapRap as jest.Mock).mockResolvedValue({ actions: [makeCrosschainAction(33)] });
    (prepareCrosschainSwap as jest.Mock).mockResolvedValue({
      call: { to: TARGET, value: '0x0', data: '0xbbb' },
      transaction: {
        ...makePreparedTransaction(33),
        type: 'bridge',
      },
    });

    const result = await walletExecuteRap(Wallet.createRandom(), 'crosschainSwap', makeCrosschainParameters({ nonce: 33 }) as never);

    expect(prepareCrosschainSwap).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: expect.objectContaining({ nonce: 33 }),
      })
    );

    expect(addNewTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          hash: '0xatomic',
          nonce: 33,
          batch: true,
          delegation: true,
        }),
      })
    );

    expect(result).toEqual({
      errorMessage: null,
      hash: '0xatomic',
      nonce: 33,
    });
  });

  it('falls back to sequential swap when nonce is missing for atomic execution', async () => {
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({ actions: [makeSwapAction(undefined)] });
    (swap as jest.Mock).mockResolvedValue({ nonce: 44, hash: '0xsequential-missing-nonce' });

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters({ nonce: undefined }) as never);

    expect(supportsDelegation).toHaveBeenCalledTimes(1);
    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-missing-nonce',
      nonce: 44,
    });
  });

  it('runs sequential path when delegation is globally disabled', async () => {
    (getRemoteConfig as jest.Mock).mockReturnValue({ delegation_enabled: false });
    (getExperimentalFlag as jest.Mock).mockReturnValue(false);
    (createUnlockAndSwapRap as jest.Mock).mockResolvedValue({ actions: [makeSwapAction(55)] });
    (swap as jest.Mock).mockResolvedValue({ nonce: 55, hash: '0xsequential-no-delegation' });

    const result = await walletExecuteRap(Wallet.createRandom(), 'swap', makeSwapParameters({ nonce: 55 }) as never);

    expect(supportsDelegation).not.toHaveBeenCalled();
    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-no-delegation',
      nonce: 55,
    });
  });

  it('runs sequential crosschain swap when atomic is not requested', async () => {
    (createUnlockAndCrosschainSwapRap as jest.Mock).mockResolvedValue({ actions: [makeCrosschainAction(66)] });
    (crosschainSwap as jest.Mock).mockResolvedValue({ nonce: 66, hash: '0xsequential-crosschain-non-atomic' });

    const result = await walletExecuteRap(
      Wallet.createRandom(),
      'crosschainSwap',
      makeCrosschainParameters({ atomic: false, nonce: 66 }) as never
    );

    expect(supportsDelegation).not.toHaveBeenCalled();
    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(crosschainSwap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-crosschain-non-atomic',
      nonce: 66,
    });
  });

  it('falls back to sequential crosschain swap when delegation support is unavailable', async () => {
    (supportsDelegation as jest.Mock).mockResolvedValue({ supported: false, reason: 'UNSUPPORTED_CHAIN' });
    (createUnlockAndCrosschainSwapRap as jest.Mock).mockResolvedValue({ actions: [makeCrosschainAction(71)] });
    (crosschainSwap as jest.Mock).mockResolvedValue({ nonce: 71, hash: '0xsequential-crosschain-unsupported' });

    const result = await walletExecuteRap(Wallet.createRandom(), 'crosschainSwap', makeCrosschainParameters({ nonce: 71 }) as never);

    expect(executeBatchedTransaction).not.toHaveBeenCalled();
    expect(crosschainSwap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      errorMessage: null,
      hash: '0xsequential-crosschain-unsupported',
      nonce: 71,
    });
  });
});
