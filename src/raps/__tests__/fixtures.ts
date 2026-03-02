import { type Quote, SwapType } from '@rainbow-me/swaps';
import { type GasFeeParam, type GasFeeParamsBySpeed, type TransactionGasParamAmounts } from '@/entities/gas';
import { ChainId } from '@/state/backendNetworks/types';
import { type ParsedAsset } from '@/__swaps__/types/assets';
import { type RapAction, type RapSwapActionParameters } from '../references';
import { type TransactionClaimableTxPayload } from '@/screens/claimables/transaction/types';
import { getAddress } from 'viem';

export const TEST_OWNER_ADDRESS = '0x1111111111111111111111111111111111111111';
export const TEST_ALLOWANCE_TARGET = '0x2222222222222222222222222222222222222222';
export const TEST_QUOTE_TO = '0x3333333333333333333333333333333333333333';
export const TEST_SELL_TOKEN = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const TEST_BUY_TOKEN = '0x4200000000000000000000000000000000000006';

function createGasFeeParam(amount: string): GasFeeParam {
  return {
    amount,
    display: amount,
    gwei: amount,
  };
}

export function createGasFeeParamsBySpeed(): GasFeeParamsBySpeed {
  const fastBaseFee = createGasFeeParam('10');
  const fastPriorityFee = createGasFeeParam('2');

  return {
    fast: {
      maxBaseFee: fastBaseFee,
      maxPriorityFeePerGas: fastPriorityFee,
      option: 'fast',
      estimatedTime: {
        amount: 15,
        display: '15s',
      },
    },
  };
}

export function createEip1559GasParams(): TransactionGasParamAmounts {
  return {
    maxFeePerGas: '12',
    maxPriorityFeePerGas: '2',
  };
}

export function createAsset({
  address,
  symbol,
  decimals = 18,
  chainId = ChainId.mainnet,
}: {
  address: string;
  symbol: string;
  decimals?: number;
  chainId?: number;
}): ParsedAsset {
  const normalizedAddress = getAddress(address);
  const normalizedChainId: ChainId = chainId;

  return {
    address: normalizedAddress,
    chainId: normalizedChainId,
    chainName: 'mainnet',
    decimals,
    isNativeAsset: false,
    name: symbol,
    symbol,
    uniqueId: `${normalizedAddress}_${normalizedChainId}`,
    native: {},
    mainnetAddress: normalizedAddress,
    networks: {
      [normalizedChainId]: {
        address: normalizedAddress,
        decimals,
      },
    },
    price: {
      value: 1,
    },
  };
}

export function createQuote(overrides: Partial<Quote> = {}): Quote {
  const sellTokenAddress = overrides.sellTokenAddress ?? TEST_SELL_TOKEN;
  const buyTokenAddress = overrides.buyTokenAddress ?? TEST_BUY_TOKEN;
  const chainId = overrides.chainId ?? ChainId.mainnet;

  return {
    from: TEST_OWNER_ADDRESS,
    to: TEST_QUOTE_TO,
    data: '0xabcdef',
    value: '0',
    sellAmount: '1000000',
    sellAmountDisplay: '1',
    sellAmountInEth: '0.0003',
    sellAmountMinusFees: '1000000',
    sellTokenAddress,
    buyTokenAddress,
    buyAmount: '997000000000000000',
    buyAmountDisplay: '0.997',
    buyAmountDisplayMinimum: '0.99',
    buyAmountInEth: '0.997',
    buyAmountMinusFees: '997000000000000000',
    fee: '0',
    feeInEth: '0',
    feePercentageBasisPoints: 0,
    swapType: SwapType.normal,
    tradeAmountUSD: 1,
    tradeFeeAmountUSD: 0,
    chainId,
    allowanceTarget: TEST_ALLOWANCE_TARGET,
    allowanceNeeded: true,
    ...overrides,
  };
}

export function createSwapRapParameters(overrides: Partial<RapSwapActionParameters<'swap'>> = {}): RapSwapActionParameters<'swap'> {
  const quote = overrides.quote ?? createQuote();
  const chainId = overrides.chainId ?? quote.chainId;

  return {
    sellAmount: String(quote.sellAmount),
    chainId,
    assetToSell: createAsset({ address: quote.sellTokenAddress, symbol: 'USDC', chainId }),
    assetToBuy: createAsset({ address: quote.buyTokenAddress, symbol: 'WETH', chainId }),
    gasParams: createEip1559GasParams(),
    gasFeeParamsBySpeed: createGasFeeParamsBySpeed(),
    quote,
    atomic: true,
    ...overrides,
  };
}

export function createSwapAction(parameters: RapSwapActionParameters<'swap'> = createSwapRapParameters()): RapAction<'swap'> {
  return {
    type: 'swap',
    parameters,
    transaction: {
      hash: null,
    },
  };
}

type ClaimTxPayloadOverrides = {
  to?: string;
  from?: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  value?: '0x0';
  chainId?: number;
};

export function createClaimTxPayload(overrides: ClaimTxPayloadOverrides = {}): TransactionClaimableTxPayload {
  const {
    to = TEST_QUOTE_TO,
    from = TEST_OWNER_ADDRESS,
    nonce = 1,
    gasLimit = '21000',
    gasPrice,
    maxFeePerGas = '12',
    maxPriorityFeePerGas = '2',
    data = '0x',
    value = '0x0',
    chainId = ChainId.mainnet,
  } = overrides;

  if (gasPrice !== undefined) {
    return {
      to,
      from,
      nonce,
      gasLimit,
      gasPrice,
      data,
      value,
      chainId,
    };
  }

  return {
    to,
    from,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data,
    value,
    chainId,
  };
}

export function createClaimClaimableRapParameters(
  overrides: Partial<RapSwapActionParameters<'claimClaimable'>> = {}
): RapSwapActionParameters<'claimClaimable'> {
  const quote = overrides.quote ?? createQuote();
  const chainId = overrides.chainId ?? quote.chainId;

  return {
    sellAmount: String(quote.sellAmount),
    chainId,
    assetToSell: createAsset({ address: quote.sellTokenAddress, symbol: 'USDC', chainId }),
    assetToBuy: createAsset({ address: quote.buyTokenAddress, symbol: 'WETH', chainId }),
    gasParams: createEip1559GasParams(),
    gasFeeParamsBySpeed: createGasFeeParamsBySpeed(),
    quote,
    additionalParams: {
      claimTxns: [createClaimTxPayload({ from: quote.from, chainId })],
    },
    ...overrides,
  };
}
