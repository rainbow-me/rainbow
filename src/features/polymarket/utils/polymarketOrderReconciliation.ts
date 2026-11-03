import { type ClobClient, type OpenOrder } from '@polymarket/clob-client-v2';

import { analytics } from '@/analytics';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { collectPolymarketTradeFee, type SettlementTransactionHashes } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { divWorklet, mulWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { ensureError } from '@/logger';
import { delay } from '@/utils/delay';

// ============ Types ========================================================== //

export type MatchedOrderMetadata = {
  eventSlug: string;
  marketSlug: string;
  outcome: string;
  estimatedFeeAmountUsd?: number | string;
  quotedTradeFeeUsd: number | string;
  bestPriceUsd: number | string;
  orderPriceUsd: number | string;
  spread?: number | string;
};

type MatchedOrderContext = MatchedOrderMetadata & {
  side: 'buy' | 'sell';
  tokenId: string;
};

type MatchedOrderAmounts = { tokens: string; usd: string };

type MatchedOrderSettlement =
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'resolved'; transactionHashes: SettlementTransactionHashes };

const POLL_INTERVAL = time.seconds(1);
const POLL_TIMEOUT = time.minutes(2);
const MATCHED_STATUS = 'matched';
const TERMINAL_FAILURE_STATUSES = new Set(['canceled', 'expired', 'failed', 'rejected']);

// ============ Accepted Orders ================================================ //

export async function reconcileAcceptedPolymarketOrder({
  client,
  context,
  orderResult,
  wallet,
}: {
  client: ClobClient;
  context: MatchedOrderContext;
  orderResult: SuccessfulOrderResult;
  wallet: PolymarketWallet;
}): Promise<void> {
  const amounts = getMatchedAmountsFromAcceptedOrder(orderResult, context.side);
  const transactionHashes = toSettlementTransactionHashes(orderResult.transactionsHashes);
  const match =
    amounts && transactionHashes ? { amounts, transactionHashes } : await pollForMatchedOrder(client, orderResult, context, amounts);
  if (!match) return;

  const feeCollection = collectPolymarketTradeFee({
    matchedAmounts: match.amounts,
    orderId: orderResult.orderID,
    quotedFeeUsd: context.quotedTradeFeeUsd,
    side: context.side,
    settlementTransactionHashes: match.transactionHashes,
    tokenId: context.tokenId,
    wallet,
  });
  trackMatchedOrderAnalytics(context, match.amounts);
  await feeCollection;
}

async function pollForMatchedOrder(
  client: ClobClient,
  orderResult: SuccessfulOrderResult,
  context: MatchedOrderContext,
  acceptedAmounts: MatchedOrderAmounts | undefined
): Promise<{ amounts: MatchedOrderAmounts; transactionHashes: SettlementTransactionHashes } | undefined> {
  const orderId = orderResult.orderID;
  let status = orderResult.status?.toLowerCase() ?? '';

  try {
    const startedAt = Date.now();

    while (Date.now() - startedAt < POLL_TIMEOUT) {
      const order = await client.getOrder(orderId);
      status = order.status.toLowerCase();

      if (status === 'matched') {
        const amounts = acceptedAmounts ?? getMatchedAmountsFromPolledOrder(order);
        const settlement = await getMatchedOrderSettlement(client, order.associate_trades);

        if (settlement.status === 'failed') {
          trackOrderMatchFailedAnalytics({ context, orderId, reason: settlement.status, status: settlement.status });
          return undefined;
        }

        if (amounts && settlement.status === 'resolved') {
          return { amounts, transactionHashes: settlement.transactionHashes };
        }
      }

      if (TERMINAL_FAILURE_STATUSES.has(status)) {
        trackOrderMatchFailedAnalytics({ context, orderId, reason: status, status });
        return undefined;
      }

      await delay(POLL_INTERVAL);
    }

    trackOrderMatchFailedAnalytics({ context, orderId, reason: 'timeout', status });
    return undefined;
  } catch (e) {
    trackOrderMatchFailedAnalytics({ context, orderId, reason: 'error', status, errorMessage: ensureError(e).message });
    return undefined;
  }
}

async function getMatchedOrderSettlement(client: ClobClient, associatedTradeIds: readonly string[]): Promise<MatchedOrderSettlement> {
  const tradeIds = associatedTradeIds.filter(id => id.length > 0);
  const trades = await Promise.all(tradeIds.map(async id => (await client.getTrades({ id }, true)).find(trade => trade.id === id)));
  let transactionHashes: [string, ...string[]] | undefined;

  for (const trade of trades) {
    if (trade === undefined) return { status: 'pending' };
    if (trade.status.toLowerCase() === 'failed') return { status: 'failed' };

    const transactionHash = trade.transaction_hash;
    if (transactionHash === undefined || transactionHash.length === 0) return { status: 'pending' };

    if (transactionHashes) transactionHashes.push(transactionHash);
    else transactionHashes = [transactionHash];
  }

  return transactionHashes === undefined ? { status: 'pending' } : { status: 'resolved', transactionHashes };
}

function toSettlementTransactionHashes(transactionHashes: readonly string[] | undefined): SettlementTransactionHashes | undefined {
  if (!transactionHashes) return undefined;

  const [firstHash, ...remainingHashes] = transactionHashes.filter(hash => hash.length > 0);
  if (firstHash === undefined) return undefined;
  return [firstHash, ...remainingHashes];
}

// ============ Analytics ====================================================== //

function trackMatchedOrderAnalytics(context: MatchedOrderContext, amounts: MatchedOrderAmounts) {
  const feeAmountUsd = context.estimatedFeeAmountUsd !== undefined ? String(context.estimatedFeeAmountUsd) : '0';

  analytics.track(analytics.event.predictionsPlaceOrder, {
    eventSlug: context.eventSlug,
    marketSlug: context.marketSlug,
    outcome: context.outcome,
    orderAmountUsd: Number(amounts.usd),
    feeAmountUsd: Number(feeAmountUsd),
    tokenAmount: Number(amounts.tokens),
    tokenId: context.tokenId,
    side: context.side,
    spread: context.spread !== undefined ? Number(context.spread) : undefined,
    bestPriceUsd: Number(context.bestPriceUsd),
    orderPriceUsd: Number(context.orderPriceUsd),
    averagePriceUsd: Number(amounts.tokens) > 0 ? Number(divWorklet(amounts.usd, amounts.tokens)) : 0,
  });
}

function trackOrderMatchFailedAnalytics({
  orderId,
  context,
  reason,
  status,
  errorMessage,
}: {
  orderId: string;
  context: MatchedOrderContext;
  reason: string;
  status: string;
  errorMessage?: string;
}) {
  analytics.track(analytics.event.predictionsOrderMatchFailed, {
    orderId,
    eventSlug: context.eventSlug,
    marketSlug: context.marketSlug,
    outcome: context.outcome,
    tokenId: context.tokenId,
    side: context.side,
    reason,
    status,
    errorMessage,
  });
}

// ============ Match Amounts ================================================== //

function getMatchedAmountsFromAcceptedOrder(orderResult: SuccessfulOrderResult, side: 'buy' | 'sell'): MatchedOrderAmounts | undefined {
  if (orderResult.status?.toLowerCase() !== MATCHED_STATUS) return undefined;

  return side === 'buy'
    ? { tokens: orderResult.takingAmount, usd: orderResult.makingAmount }
    : { tokens: orderResult.makingAmount, usd: orderResult.takingAmount };
}

function getMatchedAmountsFromPolledOrder(order: OpenOrder): MatchedOrderAmounts | undefined {
  if (!order.size_matched || !order.price) return undefined;
  return {
    tokens: order.size_matched,
    usd: mulWorklet(order.size_matched, order.price),
  };
}
