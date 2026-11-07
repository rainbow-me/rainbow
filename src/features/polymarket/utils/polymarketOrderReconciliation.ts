import { type ClobClient, type OpenOrder, type Trade } from '@polymarket/clob-client-v2';

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

type OrderFill = {
  amounts: PolymarketOrderAmounts;
  tradeIds: string[];
  transactionHashes?: string[];
};

export type AcceptedOrder = { response: SuccessfulOrderResult; fill?: OrderFill };

type PolymarketOrderMatch = { amounts: PolymarketOrderAmounts; status: 'matched' } | { status: 'failed' } | { status: 'unresolved' };

type MatchedOrderSettlement = { status: 'pending' } | { status: 'failed' } | { status: 'resolved'; transactionHashes: readonly string[] };

// ============ Constants ====================================================== //

const POLL_INTERVAL = time.seconds(1);
const POLL_TIMEOUT = time.minutes(2);

const TERMINAL_FAILURE_STATUSES = new Set(['canceled', 'canceled_market_resolved', 'expired', 'failed', 'invalid', 'rejected']);

// ============ Accepted Orders ================================================ //

/**
 * Publishes accepted estimates, then reconciles positions, settlement, and fees.
 * Prepared positions publish synchronously; Sports presentation loads before publication.
 */
export async function reconcileAcceptedPolymarketOrder({
  order,
  balanceUpdate,
  client,
  context,
  wallet,
}: {
  order: AcceptedOrder;
  balanceUpdate: PolymarketBalanceUpdate;
  client: ClobClient;
  context: OrderContext;
  wallet: PolymarketWallet;
}): Promise<void> {
  const { response: orderResult, fill } = order;
  const acceptedAmounts = fill?.amounts ?? getMatchedAmountsFromAcceptedOrder(orderResult, context.side);
  const expectedAmounts = acceptedAmounts ?? context.expectedAmounts;
  const proxyAddress = wallet.address;

  publishAcceptedBalance(balanceUpdate, context, expectedAmounts);

  try {
    const positionUpdate = await publishAcceptedPosition(context, expectedAmounts);

    void refetchPolymarketStores(proxyAddress);

    const match = await resolveOrderMatch(client, order, context, acceptedAmounts);

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
function getMatchedAmountsFromAcceptedOrder(orderResult: SuccessfulOrderResult, side: 'buy' | 'sell'): PolymarketOrderAmounts | undefined {
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

export async function waitForDelayedOrder(client: ClobClient, orderId: string, market: string, secondsDelay: number): Promise<OrderFill> {
  if (secondsDelay > 0) await delay(time.seconds(secondsDelay));

  let interval = 250;

  for (;;) {
    const order = await client.getOrder(orderId).catch(() => null);
    const status = typeof order?.status === 'string' ? order.status.toLowerCase() : undefined;
    if (status && TERMINAL_FAILURE_STATUSES.has(status)) {
      throw new RainbowError(`Polymarket order ${orderId} was ${status}`);
    }

    if (!status || status === 'matched') {
      const trades = await client.getTrades({ market }).catch(() => undefined);
      const fill = trades && getOrderFill(orderId, trades);
      if (fill && fill.tradeIds.length >= (order?.associate_trades?.length ?? 0)) return fill;
    }

    await delay(interval);
    interval = Math.min(interval * 2, time.seconds(4));
  }
}

function getOrderFill(orderId: string, trades: Trade[]): OrderFill | undefined {
  let fill: OrderFill | undefined;
  for (const trade of trades) {
    if (trade.taker_order_id !== orderId) continue;
    if (trade.status === 'FAILED') throw new RainbowError(`Polymarket trade ${trade.id} failed`);

    fill ??= { amounts: { tokens: '0', usd: '0' }, tradeIds: [], transactionHashes: [] };
    fill.tradeIds.push(trade.id);
    if (trade.transaction_hash && trade.status !== 'RETRYING') {
      fill.transactionHashes?.push(trade.transaction_hash);
    } else {
      fill.transactionHashes = undefined;
    }

    fill.amounts.tokens = add(fill.amounts.tokens, trade.size);
    if (!trade.maker_orders?.length) {
      fill.amounts.usd = add(fill.amounts.usd, mulWorklet(trade.size, trade.price));
      continue;
    }

    for (const maker of trade.maker_orders) {
      const price = maker.asset_id === trade.asset_id ? maker.price : subtract('1', maker.price);
      fill.amounts.usd = add(fill.amounts.usd, mulWorklet(maker.matched_amount, price));
    }
  }
  return fill;
}

async function resolveOrderMatch(
  client: ClobClient,
  { response: orderResult, fill }: AcceptedOrder,
  context: OrderContext,
  acceptedAmounts: PolymarketOrderAmounts | undefined
): Promise<PolymarketOrderMatch> {
  const orderId = orderResult.orderID;
  let status = fill ? 'matched' : (orderResult.status?.toLowerCase() ?? '');

  try {
    const startedAt = Date.now();
    const tradeIds = fill?.tradeIds ?? orderResult.tradeIDs;
    const acceptedHashes = fill ? fill.transactionHashes : orderResult.transactionsHashes;

    if (acceptedAmounts && acceptedHashes?.length && (await confirmOrderSettlement(acceptedHashes))) {
      return { amounts: acceptedAmounts, status: 'matched' };
    }

    while (Date.now() - startedAt < POLL_TIMEOUT) {
      const order = acceptedAmounts && tradeIds?.length ? undefined : await client.getOrder(orderId);
      const ids = tradeIds?.length ? tradeIds : order?.associate_trades;

      if (typeof order?.status === 'string') status = order.status.toLowerCase();

      if (status === 'matched' && ids?.length) {
        const amounts = acceptedAmounts ?? (order && getMatchedAmountsFromPolledOrder(order));
        const settlement = await getMatchedOrderSettlement(client, ids);

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
    trackOrderMatchFailedAnalytics(context, { orderId, reason: 'error', status, errorMessage: ensureError(e).message });
    return { status: 'unresolved' };
  }
}

async function getMatchedOrderSettlement(client: ClobClient, associatedTradeIds: readonly string[]): Promise<MatchedOrderSettlement> {
  const tradeIds = associatedTradeIds.filter(id => id.length > 0);
  const trades = await Promise.all(tradeIds.map(async id => (await client.getTrades({ id }, true)).find(trade => trade.id === id)));
  const transactionHashes: string[] = [];

  for (const trade of trades) {
    if (trade === undefined) return { status: 'pending' };

    const status = trade.status.toLowerCase();
    if (status === 'failed') return { status: 'failed' };
    if (status === 'retrying') return { status: 'pending' };

    const transactionHash = trade.transaction_hash;
    if (!transactionHash?.length) return { status: 'pending' };

    transactionHashes.push(transactionHash);
  }

  return transactionHashes.length ? { status: 'resolved', transactionHashes } : { status: 'pending' };
}

async function confirmOrderSettlement(transactionHashes: readonly string[]): Promise<boolean> {
  try {
    const confirmations: Promise<void>[] = [];
    for (const hash of transactionHashes) if (hash) confirmations.push(awaitPolygonConfirmation(hash));
    if (!confirmations.length) return false;

    await Promise.all(confirmations);

    return true;
  } catch (error) {
    if (error instanceof PolymarketTransactionFailedError) return false;
    throw error;
  }
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
