import { prepareFillCrosschainQuote, prepareFillQuote } from '@rainbow-me/swaps';

import { ChainId } from '@/state/backendNetworks/types';

import { prepareCrosschainSwap } from '../crosschainSwap';
import { prepareSwap } from '../swap';

jest.mock('@rainbow-me/swaps', () => ({
  SwapType: {
    normal: 'normal',
    wrap: 'wrap',
    unwrap: 'unwrap',
    crossChain: 'crossChain',
  },
  fillCrosschainQuote: jest.fn(),
  fillQuote: jest.fn(),
  getQuoteExecutionDetails: jest.fn(),
  getTargetAddress: jest.fn((quote: { to?: string }) => quote.to),
  getWrappedAssetAddress: jest.fn(),
  getWrappedAssetMethod: jest.fn(),
  prepareFillCrosschainQuote: jest.fn(),
  prepareFillQuote: jest.fn(),
  unwrapNativeAsset: jest.fn(),
  wrapNativeAsset: jest.fn(),
}));

jest.mock('../../utils', () => ({
  CHAIN_IDS_WITH_TRACE_SUPPORT: [],
  SWAP_GAS_PADDING: 1,
  estimateSwapGasLimitWithFakeApproval: jest.fn(),
  estimateTransactionsGasLimit: jest.fn(),
  getDefaultGasLimitForTrade: jest.fn(() => '21000'),
  overrideWithFastSpeedIfNeeded: jest.fn(({ gasParams }) => gasParams),
  populateSwap: jest.fn(),
}));

jest.mock('../unlock', () => ({
  estimateApprove: jest.fn(),
  populateApprove: jest.fn(),
}));

jest.mock('../../common', () => ({
  swapMetadataStorage: {
    set: jest.fn(),
  },
}));

jest.mock('@/handlers/web3', () => ({
  estimateGasWithPadding: jest.fn(),
  getProvider: jest.fn(() => ({ id: 'provider' })),
  toHex: (value: bigint | number | string) => {
    if (typeof value === 'string') {
      if (value.startsWith('0x')) return value;
      return `0x${BigInt(value).toString(16)}`;
    }
    return `0x${BigInt(value).toString(16)}`;
  },
}));

jest.mock('@/state/pendingTransactions', () => ({
  addNewTransaction: jest.fn(),
}));

jest.mock('@/state/performance/performance', () => ({
  Screens: { SWAPS: 'SWAPS' },
  TimeToSignOperation: {
    BroadcastTransaction: 'BroadcastTransaction',
  },
  executeFn: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: () => ({ degenMode: false }),
  },
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: () => ({
      getChainsName: () => ({
        1: 'Ethereum',
      }),
    }),
  },
}));

const FROM = '0x1111111111111111111111111111111111111111';
const RAW_TO = '0x2222222222222222222222222222222222222222';
const PREPARED_TO = '0x3333333333333333333333333333333333333333';

const baseAsset = {
  chainId: ChainId.mainnet,
  address: RAW_TO,
  mainnetAddress: RAW_TO,
  networks: {
    [ChainId.mainnet]: {
      address: RAW_TO,
    },
  },
  colors: {},
  price: { value: '1' },
};

const baseGasParams = {
  maxFeePerGas: '10',
  maxPriorityFeePerGas: '2',
};

const baseSwapQuote = {
  from: FROM,
  to: RAW_TO,
  data: '0xaaaa',
  value: '0x0',
  sellAmount: 100n,
  buyAmountMinusFees: 95n,
  defaultGasLimit: '21000',
};

const baseCrosschainQuote = {
  ...baseSwapQuote,
  routes: [
    {
      userTxs: [
        {
          gasFees: {
            gasLimit: '250000',
          },
        },
      ],
    },
  ],
};

describe('atomic prepare metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prepareSwap returns prepared calldata and keeps nonce in transaction metadata', async () => {
    (prepareFillQuote as jest.Mock).mockResolvedValue({
      to: PREPARED_TO,
      value: 42n,
      data: '0xdeadbeef',
    });

    const parameters = {
      chainId: ChainId.mainnet,
      nonce: 77,
      quote: baseSwapQuote,
      sellAmount: '100',
      assetToSell: baseAsset,
      assetToBuy: baseAsset,
      gasParams: baseGasParams,
      gasFeeParamsBySpeed: {},
    };

    const result = await prepareSwap({
      chainId: ChainId.mainnet,
      wallet: {} as never,
      quote: parameters.quote as never,
      parameters: parameters as never,
    });

    expect(result.call).toEqual({
      to: PREPARED_TO,
      value: '0x2a',
      data: '0xdeadbeef',
    });

    expect(result.transaction).toEqual(
      expect.objectContaining({
        nonce: 77,
        to: PREPARED_TO,
        value: '0x2a',
        data: '0xdeadbeef',
      })
    );
  });

  it('prepareCrosschainSwap returns prepared calldata and keeps nonce in transaction metadata', async () => {
    (prepareFillCrosschainQuote as jest.Mock).mockResolvedValue({
      to: PREPARED_TO,
      value: 64n,
      data: '0xbeefcafe',
    });

    const parameters = {
      chainId: ChainId.mainnet,
      nonce: 91,
      quote: baseCrosschainQuote,
      sellAmount: '100',
      assetToSell: baseAsset,
      assetToBuy: baseAsset,
      gasParams: baseGasParams,
      gasFeeParamsBySpeed: {},
    };

    const result = await prepareCrosschainSwap({
      chainId: ChainId.mainnet,
      wallet: {} as never,
      quote: parameters.quote as never,
      parameters: parameters as never,
    });

    expect(result.call).toEqual({
      to: PREPARED_TO,
      value: '0x40',
      data: '0xbeefcafe',
    });

    expect(result.transaction).toEqual(
      expect.objectContaining({
        nonce: 91,
        to: PREPARED_TO,
        value: '0x40',
        data: '0xbeefcafe',
      })
    );
  });
});
