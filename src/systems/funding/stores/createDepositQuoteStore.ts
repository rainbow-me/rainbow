import { getAddress, type Address } from 'viem';
import {
  type ChainId as SwapsChainId,
  type CrosschainQuote,
  type Quote,
  type QuoteParams,
  Source,
  SwapType,
  type TokenAsset,
  ETH_ADDRESS,
} from '@rainbow-me/swaps';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { equalWorklet, greaterThanWorklet } from '@/framework/core/safeMath';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type InferStoreState } from '@/state/internal/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import {
  type AmountStoreType,
  type DepositConfig,
  DepositQuoteStatus,
  type DepositQuoteStoreParams,
  type DepositQuoteStoreType,
  type DepositStoreType,
} from '../types';
import { fetchAndValidateCrosschainQuote } from '../utils/crosschainQuote';
import { isValidSwapsChainId } from '../utils/quotes';
import { fetchAndValidateSameChainQuote } from '../utils/sameChainQuote';
import { resolveDefaultSlippage } from '../utils/slippage';
import { isNativeAsset } from '@/handlers/assets';

// ============ Quote Store Factory ============================================ //

export function createDepositQuoteStore(
  config: DepositConfig,
  useAmountStore: AmountStoreType,
  useDepositStore: DepositStoreType
): DepositQuoteStoreType {
  const recipientStore = config.to.recipient;
  return createQueryStore({
    fetcher: createQuoteFetcher(config),
    params: {
      accountAddress: $ => $(useWalletsStore).accountAddress,
      amount: $ => $(useAmountStore, state => state.amount),
      asset: $ => $(useDepositStore, selectDepositAsset),
      recipient: recipientStore ? $ => $(recipientStore) : null,
    },
    cacheTime: time.seconds(30),
    staleTime: time.seconds(15),
  });
}

// ============ Quote Fetcher ================================================== //

type DepositQuoteResult =
  | Quote
  | CrosschainQuote
  | DepositQuoteStatus.Error
  | DepositQuoteStatus.InsufficientBalance
  | DepositQuoteStatus.InsufficientGas
  | null;

function createQuoteFetcher(config: DepositConfig) {
  return async function fetchQuote(
    { accountAddress, amount, asset, recipient }: DepositQuoteStoreParams,
    abortController: AbortController | null
  ): Promise<DepositQuoteResult> {
    if (!asset) return null;
    if (config.to.recipient && !recipient) return null;

    const normalizedAmount = stripNonDecimalNumbers(amount) || '0';
    if (equalWorklet(normalizedAmount, '0')) return null;
    if (greaterThanWorklet(normalizedAmount, asset.balance)) {
      return DepositQuoteStatus.InsufficientBalance;
    }

    const assetChainId = asset.chainId;
    const isCrosschain = assetChainId !== config.to.chainId;
    const isSameTokenOnTarget =
      !isCrosschain && asset.address.toLowerCase() === config.to.token.address.toLowerCase() && assetChainId === config.to.chainId;

    if (isSameTokenOnTarget && config.directTransferEnabled) {
      return buildSyntheticTransferQuote(config, accountAddress, asset, normalizedAmount, assetChainId);
    }

    const slippage = config.quote?.slippage ?? resolveDefaultSlippage(assetChainId);

    const quoteParams: QuoteParams = {
      buyTokenAddress: config.to.token.address,
      chainId: assetChainId,
      currency: userAssetsStoreManager.getState().currency,
      destReceiver: recipient ?? undefined,
      feePercentageBasisPoints: config.quote?.feeBps ?? 0,
      fromAddress: accountAddress,
      sellAmount: convertAmountToRawAmount(normalizedAmount, asset.decimals),
      sellTokenAddress: asset.isNativeAsset ? ETH_ADDRESS : getAddress(asset.address),
      slippage,
      ...(isCrosschain && {
        refuel: true,
        source: config.quote?.source ?? Source.CrosschainAggregatorRelay,
        toChainId: config.to.chainId,
      }),
    };

    if (isCrosschain) {
      return fetchAndValidateCrosschainQuote(quoteParams, recipient, abortController?.signal);
    }

    return fetchAndValidateSameChainQuote(quoteParams, abortController?.signal);
  };
}

// ============ Synthetic Transfer Quote ======================================= //

function buildSyntheticTransferQuote(
  config: DepositConfig,
  accountAddress: Address,
  asset: NonNullable<DepositQuoteStoreParams['asset']>,
  normalizedAmount: string,
  assetChainId: ChainId
): Quote | DepositQuoteStatus.Error {
  if (!isValidSwapsChainId(assetChainId)) return DepositQuoteStatus.Error;

  const rawAmount = convertAmountToRawAmount(normalizedAmount, asset.decimals);
  const tokenAsset = buildTokenAsset(config, asset, assetChainId);

  return {
    allowanceNeeded: false,
    allowanceTarget: asset.address,
    buyAmount: rawAmount,
    buyAmountDisplay: rawAmount,
    buyAmountDisplayMinimum: rawAmount,
    buyAmountInEth: rawAmount,
    buyAmountMinusFees: rawAmount,
    buyTokenAddress: asset.isNativeAsset ? ETH_ADDRESS : getAddress(asset.address),
    buyTokenAsset: tokenAsset,
    chainId: assetChainId,
    data: '0x',
    fallback: false,
    fee: '0',
    feeInEth: '0',
    feePercentageBasisPoints: 0,
    from: accountAddress,
    inputTokenDecimals: asset.decimals,
    outputTokenDecimals: asset.decimals,
    protocols: [],
    sellAmount: rawAmount,
    sellAmountDisplay: rawAmount,
    sellAmountInEth: rawAmount,
    sellAmountMinusFees: rawAmount,
    sellTokenAddress: asset.isNativeAsset ? ETH_ADDRESS : getAddress(asset.address),
    sellTokenAsset: tokenAsset,
    swapType: SwapType.normal,
    to: config.to.token.address,
    tradeAmountUSD: Number(normalizedAmount) * (asset.price?.value ?? 1),
    tradeFeeAmountUSD: 0,
    value: '0',
  };
}

function buildTokenAsset(config: DepositConfig, asset: NonNullable<DepositQuoteStoreParams['asset']>, chainId: SwapsChainId): TokenAsset {
  const symbol = asset.symbol ?? config.to.token.symbol;
  return {
    assetCode: config.to.token.address,
    chainId,
    decimals: asset.decimals,
    iconUrl: asset.icon_url ?? '',
    name: asset.name ?? symbol,
    network: String(chainId),
    networks: {
      [chainId]: {
        address: asset.address,
        decimals: asset.decimals,
      },
    },
    price: {
      available: true,
      value: asset.price?.value ?? 1,
    },
    symbol,
    totalPrice: {
      available: true,
      value: asset.price?.value ?? 1,
    },
  };
}

// ============ Helpers ======================================================== //

function selectDepositAsset(state: InferStoreState<DepositStoreType>): DepositQuoteStoreParams['asset'] | null {
  const asset = state.asset;
  if (!asset) return null;

  return {
    address: asset.address,
    balance: asset.balance?.amount ?? '0',
    chainId: asset.chainId,
    decimals: asset.decimals,
    icon_url: asset.icon_url,
    name: asset.name,
    price: asset.price,
    symbol: asset.symbol,
    isNativeAsset: isNativeAsset(asset.address, asset.chainId),
  };
}
