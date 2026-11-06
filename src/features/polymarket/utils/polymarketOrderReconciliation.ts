import { type ClobClient, type OpenOrder } from '@polymarket/clob-client-v2';

import { analytics } from '@/analytics';
import { PolymarketTransactionFailedError } from '@/features/polymarket/errors';
import { type PolymarketBalanceUpdate } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderDetails, type SportsOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import {
  polymarketPositionsActions,
  type PolymarketBuyPositionUpdate,
  type PolymarketPositionUpdate,
} from '@/features/polymarket/stores/polymarketPositionsStore';
import { type PolymarketOrderAmounts, type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { collectPolymarketTradeFee } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { awaitPolygonConfirmation } from '@/features/polymarket/utils/confirmation';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { fetchTeamsForEvent } from '@/features/polymarket/utils/sports';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { divWorklet, greaterThanWorklet, mulWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { add, subtract } from '@/helpers/utilities';
import { ensureError, logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

// ============ Types ========================================================== //

export type OrderQuote = {
  expectedAmounts: PolymarketOrderAmounts;
  quotedTotalFeeUsd: string;
  quotedRainbowFeeUsd: string;
  bestPriceUsd: string;
  orderPriceUsd: string;
  spread: string;
};

export type OrderContext = OrderQuote & { eventSlug: string; marketSlug: string; outcome: string; tokenId: string } & (
    | ({ side: 'buy'; positionUpdate: PolymarketBuyPositionUpdate } & (PolymarketOrderDetails | SportsOrderDetails))
    | { side: 'sell'; position: PolymarketPosition }
  );

type PolymarketOrderMatch = { amounts: PolymarketOrderAmounts; status: 'matched' } | { status: 'failed' } | { status: 'unresolved' };

type SettlementTransactionHashes = readonly [string, ...string[]];

type MatchedOrderSettlement =
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'resolved'; transactionHashes: SettlementTransactionHashes };

// ============ Constants ====================================================== //

const POLL_INTERVAL = time.seconds(1);
const POLL_TIMEOUT = time.minutes(2);

const TERMINAL_FAILURE_STATUSES = new Set(['canceled', 'expired', 'failed', 'rejected']);

// ============ Accepted Orders ================================================ //

/**
 * Publishes accepted estimates, then reconciles positions, settlement, and fees.
 * Prepared positions publish synchronously; Sports presentation loads before publication.
 */
export async function reconcileAcceptedPolymarketOrder({
  acceptedAmounts,
  balanceUpdate,
  client,
  context,
  orderResult,
  wallet,
}: {
  acceptedAmounts: PolymarketOrderAmounts | undefined;
  balanceUpdate: PolymarketBalanceUpdate;
  client: ClobClient;
  context: OrderContext;
  orderResult: SuccessfulOrderResult;
  wallet: PolymarketWallet;
}): Promise<void> {
  const expectedAmounts = acceptedAmounts ?? context.expectedAmounts;
  const proxyAddress = wallet.address;

  publishAcceptedBalance(balanceUpdate, context, expectedAmounts);

  try {
    const positionUpdate = await publishAcceptedPosition(context, expectedAmounts);

    void refetchPolymarketStores(proxyAddress);

    const match = await resolveOrderMatch(client, orderResult, context, acceptedAmounts);

    if (match.status === 'failed') {
      positionUpdate?.discard();
      balanceUpdate.discard();
      await refetchPolymarketStores(proxyAddress);
      return;
    }

    if (match.status === 'unresolved') {
      await refetchPolymarketStores(proxyAddress);
      return;
    }

    let principalAdjustmentUsd: string;
    if (context.side === 'buy') {
      if (!acceptedAmounts) {
        context.positionUpdate.amend(match.amounts);
      }

      principalAdjustmentUsd = subtract(expectedAmounts.usd, match.amounts.usd);
    } else {
      principalAdjustmentUsd = subtract(match.amounts.usd, expectedAmounts.usd);
    }

    const feeCollection = collectPolymarketTradeFee({
      matchedAmounts: match.amounts,
      orderId: orderResult.orderID,
      quotedFeeUsd: context.quotedRainbowFeeUsd,
      side: context.side,
      tokenId: context.tokenId,
      wallet,
    });

    trackMatchedOrderAnalytics(context, match.amounts);

    const collectedFeeUsd = await feeCollection;
    if (collectedFeeUsd === undefined) return;

    const feeAdjustmentUsd = subtract(context.quotedRainbowFeeUsd, collectedFeeUsd);

    balanceUpdate.finalize(add(principalAdjustmentUsd, feeAdjustmentUsd));
    await refetchPolymarketStores(proxyAddress);
  } catch (error) {
    logger.error(new RainbowError('[polymarketOrderReconciliation] Error reconciling accepted order', ensureError(error)));
  }
}

/**
 * Reads a usable fill from the accepted order response, preserving buy/sell amount units.
 */
export function getMatchedAmountsFromAcceptedOrder(
  orderResult: SuccessfulOrderResult,
  side: 'buy' | 'sell'
): PolymarketOrderAmounts | undefined {
  if (orderResult.status?.toLowerCase() !== 'matched') return undefined;

  const amounts =
    side === 'buy'
      ? { tokens: orderResult.takingAmount, usd: orderResult.makingAmount }
      : { tokens: orderResult.makingAmount, usd: orderResult.takingAmount };

  return areOrderAmountsUsable(amounts) ? amounts : undefined;
}

// ============ Optimistic Updates ============================================= //

function publishAcceptedBalance(balanceUpdate: PolymarketBalanceUpdate, context: OrderContext, amounts: PolymarketOrderAmounts): void {
  try {
    const deltaUsd =
      context.side === 'buy'
        ? subtract('0', add(amounts.usd, context.quotedTotalFeeUsd))
        : subtract(amounts.usd, context.quotedTotalFeeUsd);

    balanceUpdate.apply(deltaUsd);
  } catch (error) {
    logger.error(new RainbowError('[polymarketOrderReconciliation] Error publishing accepted balance', ensureError(error)));
  }
}

async function publishAcceptedPosition(
  context: OrderContext,
  amounts: PolymarketOrderAmounts
): Promise<PolymarketPositionUpdate | undefined> {
  let positionUpdate: PolymarketPositionUpdate | undefined;

  try {
    if (context.side === 'buy') {
      positionUpdate = context.positionUpdate;

      const details = isSportsOrderDetails(context) ? await loadSportsPositionDetails(context) : context;
      context.positionUpdate.publish(details, amounts);
    } else {
      positionUpdate = polymarketPositionsActions.remove(context.position);
    }
  } catch (error) {
    positionUpdate?.discard();

    logger.error(new RainbowError('[polymarketOrderReconciliation] Error publishing accepted position', ensureError(error)));
  }

  return positionUpdate;
}

async function loadSportsPositionDetails({ event: rawEvent, outcomeIndex }: SportsOrderDetails): Promise<PolymarketOrderDetails> {
  const [event, teams] = await Promise.all([processRawPolymarketEvent(rawEvent), fetchTeamsForEvent(rawEvent)]);
  return { event: { ...event, teams }, market: event.markets[0], outcomeIndex };
}

function isSportsOrderDetails(details: PolymarketOrderDetails | SportsOrderDetails): details is SportsOrderDetails {
  return !('color' in details.market);
}

// ============ Order Matching ================================================= //

async function resolveOrderMatch(
  client: ClobClient,
  orderResult: SuccessfulOrderResult,
  context: OrderContext,
  acceptedAmounts: PolymarketOrderAmounts | undefined
): Promise<PolymarketOrderMatch> {
  const orderId = orderResult.orderID;
  let status = orderResult.status?.toLowerCase() ?? '';

  try {
    const startedAt = Date.now();

    const acceptedHashes = toSettlementTransactionHashes(orderResult.transactionsHashes);
    if (acceptedAmounts && acceptedHashes && (await confirmOrderSettlement(acceptedHashes))) {
      return { amounts: acceptedAmounts, status: 'matched' };
    }

    while (Date.now() - startedAt < POLL_TIMEOUT) {
      const order = await client.getOrder(orderId);
      status = order.status.toLowerCase();

      if (status === 'matched') {
        const amounts = acceptedAmounts ?? getMatchedAmountsFromPolledOrder(order);
        const settlement = await getMatchedOrderSettlement(client, order.associate_trades);

        if (settlement.status === 'failed') {
          trackOrderMatchFailedAnalytics(context, { orderId, reason: settlement.status, status: settlement.status });
          return { status: 'failed' };
        }

        if (amounts && settlement.status === 'resolved' && (await confirmOrderSettlement(settlement.transactionHashes))) {
          return { amounts, status: 'matched' };
        }
      }

      if (TERMINAL_FAILURE_STATUSES.has(status)) {
        trackOrderMatchFailedAnalytics(context, { orderId, reason: status, status });
        return { status: 'failed' };
      }

      await delay(POLL_INTERVAL);
    }

    trackOrderMatchFailedAnalytics(context, { orderId, reason: 'timeout', status });
    return { status: 'unresolved' };
  } catch (e) {
    trackOrderMatchFailedAnalytics(context, {
      orderId,
      reason: 'error',
      status,
      errorMessage: ensureError(e).message,
    });
    return { status: 'unresolved' };
  }
}

async function getMatchedOrderSettlement(client: ClobClient, associatedTradeIds: readonly string[]): Promise<MatchedOrderSettlement> {
  const tradeIds = associatedTradeIds.filter(id => id.length > 0);
  const trades = await Promise.all(tradeIds.map(async id => (await client.getTrades({ id }, true)).find(trade => trade.id === id)));
  let transactionHashes: [string, ...string[]] | undefined;

  for (const trade of trades) {
    if (trade === undefined) return { status: 'pending' };

    const status = trade.status.toLowerCase();
    if (status === 'failed') return { status: 'failed' };
    if (status === 'retrying') return { status: 'pending' };

    const transactionHash = trade.transaction_hash;
    if (transactionHash === undefined || transactionHash.length === 0) return { status: 'pending' };

    if (transactionHashes) transactionHashes.push(transactionHash);
    else transactionHashes = [transactionHash];
  }

  return transactionHashes === undefined ? { status: 'pending' } : { status: 'resolved', transactionHashes };
}

async function confirmOrderSettlement(transactionHashes: SettlementTransactionHashes): Promise<boolean> {
  try {
    await Promise.all(transactionHashes.map(hash => awaitPolygonConfirmation(hash)));
    return true;
  } catch (error) {
    if (error instanceof PolymarketTransactionFailedError) return false;
    throw error;
  }
}

function toSettlementTransactionHashes(transactionHashes: readonly string[] | undefined): SettlementTransactionHashes | undefined {
  if (!transactionHashes) return undefined;

  const [firstHash, ...remainingHashes] = transactionHashes.filter(hash => hash.length > 0);
  if (firstHash === undefined) return undefined;

  return [firstHash, ...remainingHashes];
}

function getMatchedAmountsFromPolledOrder(order: OpenOrder): PolymarketOrderAmounts | undefined {
  if (!order.size_matched || !order.price) return undefined;

  const amounts = {
    tokens: order.size_matched,
    usd: mulWorklet(order.size_matched, order.price),
  };

  return areOrderAmountsUsable(amounts) ? amounts : undefined;
}

function areOrderAmountsUsable({ tokens, usd }: PolymarketOrderAmounts): boolean {
  return greaterThanWorklet(tokens, '0') && greaterThanWorklet(usd, '0');
}

// ============ Analytics ====================================================== //

function trackMatchedOrderAnalytics(context: OrderContext, amounts: PolymarketOrderAmounts): void {
  analytics.track(analytics.event.predictionsPlaceOrder, {
    eventSlug: context.eventSlug,
    marketSlug: context.marketSlug,
    outcome: context.outcome,
    orderAmountUsd: Number(amounts.usd),
    feeAmountUsd: Number(context.quotedTotalFeeUsd),
    tokenAmount: Number(amounts.tokens),
    tokenId: context.tokenId,
    side: context.side,
    spread: Number(context.spread),
    bestPriceUsd: Number(context.bestPriceUsd),
    orderPriceUsd: Number(context.orderPriceUsd),
    averagePriceUsd: Number(divWorklet(amounts.usd, amounts.tokens)),
  });
}

function trackOrderMatchFailedAnalytics(
  context: OrderContext,
  failure: { orderId: string; reason: string; status: string; errorMessage?: string }
): void {
  analytics.track(analytics.event.predictionsOrderMatchFailed, {
    ...failure,
    eventSlug: context.eventSlug,
    marketSlug: context.marketSlug,
    outcome: context.outcome,
    tokenId: context.tokenId,
    side: context.side,
  });
}
