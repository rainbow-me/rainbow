import { ChainId } from '@/state/backendNetworks/types';

import { needsTokenApproval } from '../actions/unlock';
import { createUnlockAndCrosschainSwapRap } from '../unlockAndCrosschainSwap';
import { createUnlockAndSwapRap } from '../unlockAndSwap';

jest.mock('@rainbow-me/swaps', () => ({
  getTargetAddress: jest.fn(() => '0x3333333333333333333333333333333333333333'),
  isAllowedTargetContract: jest.fn(() => true),
}));

jest.mock('../actions/unlock', () => ({
  needsTokenApproval: jest.fn(),
}));

jest.mock('../validation', () => ({
  getQuoteAllowanceTargetAddress: jest.fn(() => '0x4444444444444444444444444444444444444444'),
}));

const baseGasParams = {
  maxFeePerGas: '10',
  maxPriorityFeePerGas: '2',
};

const baseGasFeeParamsBySpeed = {
  fast: {
    maxFeePerGas: { amount: '10' },
    maxPriorityFeePerGas: { amount: '2' },
  },
};

const baseAsset = {
  chainId: ChainId.mainnet,
  address: '0x5555555555555555555555555555555555555555',
  mainnetAddress: '0x5555555555555555555555555555555555555555',
  networks: {
    [ChainId.mainnet]: {
      address: '0x5555555555555555555555555555555555555555',
    },
  },
  colors: {},
  price: { value: '1' },
};

const baseQuote = {
  from: '0x1111111111111111111111111111111111111111',
  to: '0x3333333333333333333333333333333333333333',
  data: '0xabcdef',
  value: '0x0',
  sellTokenAddress: '0x6666666666666666666666666666666666666666',
  allowanceNeeded: false,
  sellAmount: 1n,
  buyAmountMinusFees: 1n,
};

const makeSwapParameters = (overrides: Record<string, unknown> = {}) => ({
  sellAmount: '1',
  chainId: ChainId.mainnet,
  nonce: 42,
  quote: baseQuote,
  assetToSell: baseAsset,
  assetToBuy: baseAsset,
  gasParams: baseGasParams,
  gasFeeParamsBySpeed: baseGasFeeParamsBySpeed,
  ...overrides,
});

describe('rap factory nonce propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (needsTokenApproval as jest.Mock).mockResolvedValue(false);
  });

  it('forwards nonce to the swap action in createUnlockAndSwapRap', async () => {
    const rap = await createUnlockAndSwapRap(makeSwapParameters({ nonce: 77 }) as never);

    expect(rap.actions).toHaveLength(1);
    expect(rap.actions[0].type).toBe('swap');
    expect(rap.actions[0].parameters).toEqual(expect.objectContaining({ nonce: 77 }));
  });

  it('keeps nonce on the swap action even when unlock is required', async () => {
    (needsTokenApproval as jest.Mock).mockResolvedValue(true);

    const rap = await createUnlockAndSwapRap(
      makeSwapParameters({
        nonce: 88,
        quote: {
          ...baseQuote,
          allowanceNeeded: true,
        },
      }) as never
    );

    expect(rap.actions.map(action => action.type)).toEqual(['unlock', 'swap']);
    expect(rap.actions[1].parameters).toEqual(expect.objectContaining({ nonce: 88 }));
  });

  it('forwards nonce to the crosschain swap action in createUnlockAndCrosschainSwapRap', async () => {
    const rap = await createUnlockAndCrosschainSwapRap(makeSwapParameters({ nonce: 99 }) as never);

    expect(rap.actions).toHaveLength(1);
    expect(rap.actions[0].type).toBe('crosschainSwap');
    expect(rap.actions[0].parameters).toEqual(expect.objectContaining({ nonce: 99 }));
  });

  it('keeps nonce on crosschain swap action when unlock is prepended', async () => {
    (needsTokenApproval as jest.Mock).mockResolvedValue(true);

    const rap = await createUnlockAndCrosschainSwapRap(
      makeSwapParameters({
        nonce: 111,
        quote: {
          ...baseQuote,
          allowanceNeeded: true,
        },
      }) as never
    );

    expect(rap.actions.map(action => action.type)).toEqual(['unlock', 'crosschainSwap']);
    expect(rap.actions[1].parameters).toEqual(expect.objectContaining({ nonce: 111 }));
  });
});
