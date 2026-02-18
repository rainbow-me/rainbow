import { getAddress } from 'viem';
import { CrosschainQuote, ETH_ADDRESS, Quote, QuoteParams, Source } from '@rainbow-me/swaps';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { equalWorklet, greaterThanWorklet } from '@/safe-math/SafeMath';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';

import {
  AmountStoreType,
  BalanceQueryStore,
  RouteConfig,
  WithdrawalConfig,
  WithdrawalQuoteStatus,
  WithdrawalQuoteStoreParams,
  WithdrawalQuoteStoreType,
  WithdrawalStoreType,
  WithdrawalTokenStoreType,
} from '../types';
import { fetchAndValidateCrosschainQuote } from '../utils/crosschainQuote';
import { fetchAndValidateSameChainQuote } from '../utils/sameChainQuote';
import { resolveDefaultSlippage } from '../utils/slippage';
import { getWithdrawalSwapRequirement, resolveTokenAddressForChain } from '../utils/withdrawalSwap';
import { isNativeAsset } from '@/handlers/assets';

// ============ Quote Store Factory ============================================ //

export function createWithdrawalQuoteStore<TBalanceStore extends BalanceQueryStore>(
  config: WithdrawalConfig<TBalanceStore>,
  useAmountStore: AmountStoreType,
  useTokenStore: WithdrawalTokenStoreType,
  useWithdrawalStore: WithdrawalStoreType
): WithdrawalQuoteStoreType {
  const route = config.route;
  if (!route) {
    throw new Error('createWithdrawalQuoteStore requires route config');
  }

  const useResolvedBuyTokenAddress = createDerivedStore(
    $ => {
      const tokenData = $(useTokenStore, state => state.getData());
      const selectedChainId = $(useWithdrawalStore, state => state.selectedChainId);
      const address = resolveTokenAddressForChain(tokenData, selectedChainId);
      if (!address || !selectedChainId) return null;
      return isNativeAsset(address, selectedChainId) ? ETH_ADDRESS : getAddress(address);
    },
    { fastMode: true }
  );

  return createQueryStore<QuoteResult, WithdrawalQuoteStoreParams>({
    fetcher: createQuoteFetcher(route),
    params: {
      amount: $ => $(useAmountStore, state => state.amount),
      balance: $ => $(config.balanceStore, state => state.getBalance()),
      buyTokenAddress: $ => $(useResolvedBuyTokenAddress),
      destReceiver: $ => $(useWalletsStore).accountAddress,
      sourceAddress: $ => $(route.from.addressStore),
      targetChainId: $ => $(useWithdrawalStore, state => state.selectedChainId),
    },
    cacheTime: time.seconds(30),
    staleTime: time.seconds(15),
  });
}

// ============ Quote Fetcher ================================================== //

type QuoteResult = Quote | CrosschainQuote | WithdrawalQuoteStatus.InsufficientBalance | null;

function createQuoteFetcher(route: RouteConfig) {
  return async function fetchQuote(params: WithdrawalQuoteStoreParams, abortController: AbortController | null): Promise<QuoteResult> {
    const { amount, balance, buyTokenAddress, destReceiver, sourceAddress, targetChainId } = params;

    const requirement = getWithdrawalSwapRequirement({
      buyTokenAddress,
      route,
      targetChainId,
    });

    if (!requirement.requiresQuote) return null;

    // Validation checks
    if (!sourceAddress || !destReceiver || !targetChainId || !buyTokenAddress) return null;

    const normalizedAmount = stripNonDecimalNumbers(amount) || '0';
    if (equalWorklet(normalizedAmount, '0')) return null;
    if (greaterThanWorklet(normalizedAmount, balance)) {
      return WithdrawalQuoteStatus.InsufficientBalance;
    }

    const feePercentageBasisPoints = route.quote?.feeBps ?? 0;
    const slippage = route.quote?.slippage ?? resolveDefaultSlippage(route.from.chainId);

    const quoteParams: QuoteParams = {
      buyTokenAddress,
      chainId: route.from.chainId,
      currency: userAssetsStoreManager.getState().currency,
      destReceiver,
      feePercentageBasisPoints,
      fromAddress: sourceAddress,
      sellAmount: convertAmountToRawAmount(normalizedAmount, route.from.token.decimals),
      sellTokenAddress: route.from.token.address,
      slippage,
    };

    if (requirement.kind === 'crossChain') {
      return fetchAndValidateCrosschainQuote(
        {
          ...quoteParams,
          refuel: true,
          source: route.quote?.source ?? Source.CrosschainAggregatorRelay,
          toChainId: targetChainId,
        },
        destReceiver,
        abortController?.signal
      );
    }

    // requirement.kind === 'sameChain' — getWithdrawalSwapRequirement already
    // verified the buy token differs from the sell token
    return fetchAndValidateSameChainQuote(quoteParams, abortController?.signal);
  };
}
