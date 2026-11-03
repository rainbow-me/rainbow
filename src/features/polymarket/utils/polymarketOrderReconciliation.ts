import { type ClobClient, type OpenOrder } from '@polymarket/clob-client-v2';

import { analytics } from '@/analytics';
import { polymarketBalanceActions } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderDetails, type SportsOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { type PolymarketOrderAmounts, type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { collectPolymarketTradeFee, type SettlementTransactionHashes } from '@/features/polymarket/utils/collectPolymarketTradeFee';
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
    | ({ side: 'buy'; positionOperationId: string } & (PolymarketOrderDetails | SportsOrderDetails))
    | { side: 'sell'; position: PolymarketPosition }
  );

type PolymarketOrderMatch =
  | { amounts: PolymarketOrderAmounts; status: 'matched'; transactionHashes: SettlementTransactionHashes }
  | { status: 'notMatched' | 'unresolved' };

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
  baselineBalance,
  client,
  context,
  orderResult,
  wallet,
}: {
  acceptedAmounts: PolymarketOrderAmounts | undefined;
  baselineBalance: ReturnType<typeof polymarketBalanceActions.getBalanceSnapshot>;
  client: ClobClient;
  context: OrderContext;
  orderResult: SuccessfulOrderResult;
  wallet: PolymarketWallet;
}): Promise<void> {
  const expectedAmounts = acceptedAmounts ?? context.expectedAmounts;
  const orderId = orderResult.orderID;
  const positionOperationId = context.side === 'buy' ? context.positionOperationId : orderId;
  const proxyAddress = wallet.address;

  try {
    if (baselineBalance) {
      polymarketBalanceActions.applyExpectedBalanceDelta({
        baseline: baselineBalance,
        deltaUsd:
          context.side === 'buy'
            ? subtract('0', add(expectedAmounts.usd, context.quotedTotalFeeUsd))
            : subtract(expectedAmounts.usd, context.quotedTotalFeeUsd),
        operationId: orderId,
        proxyWallet: proxyAddress,
      });
    }
  } catch (error) {
    logger.error(new RainbowError('[polymarketOrderReconciliation] Error publishing accepted balance', ensureError(error)));
  }

  try {
    let positionDetails: PolymarketOrderDetails | undefined;

    try {
      if (context.side === 'buy') {
        positionDetails = isSportsOrderDetails(context) ? await loadSportsPositionDetails(context) : context;
        polymarketPositionsActions.applyExpectedBuyPosition({
          ...positionDetails,
          operationId: positionOperationId,
          positionAmounts: expectedAmounts,
          proxyAddress,
        });
      } else {
        polymarketPositionsActions.applyExpectedPositionRemoval({ operationId: orderId, position: context.position });
      }
    } catch (error) {
      polymarketPositionsActions.discardExpectedPosition({
        asset: context.tokenId,
        operationId: positionOperationId,
        proxyAddress,
      });

      logger.error(new RainbowError('[polymarketOrderReconciliation] Error publishing accepted position', ensureError(error)));
    }

    void refetchPolymarketStores(proxyAddress);

    const transactionHashes = toSettlementTransactionHashes(orderResult.transactionsHashes);
    const needsMatchPolling = !acceptedAmounts || !transactionHashes;
    const match: PolymarketOrderMatch = needsMatchPolling
      ? await pollForMatchedOrder(client, orderResult, context, acceptedAmounts)
      : { amounts: acceptedAmounts, status: 'matched', transactionHashes };

    if (match.status !== 'matched') {
      if (match.status === 'notMatched') {
        polymarketPositionsActions.discardExpectedPosition({ asset: context.tokenId, operationId: positionOperationId, proxyAddress });
        polymarketBalanceActions.discardExpectedBalanceDelta({ operationId: orderId, proxyWallet: proxyAddress });
      }
      await refetchPolymarketStores(proxyAddress);
      return;
    }

    if (positionDetails && needsMatchPolling) {
      polymarketPositionsActions.amendExpectedBuyPosition({
        ...positionDetails,
        operationId: positionOperationId,
        positionAmounts: match.amounts,
        proxyAddress,
      });
    }

    const feeCollection = collectPolymarketTradeFee({
      matchedAmounts: match.amounts,
      orderId,
      quotedFeeUsd: context.quotedRainbowFeeUsd,
      side: context.side,
      settlementTransactionHashes: match.transactionHashes,
      tokenId: context.tokenId,
      wallet,
    });
    trackMatchedOrderAnalytics(context, match.amounts);

    const collectedFeeUsd = await feeCollection;
    if (collectedFeeUsd === undefined) return;

    const principalAdjustmentUsd =
      context.side === 'buy' ? subtract(expectedAmounts.usd, match.amounts.usd) : subtract(match.amounts.usd, expectedAmounts.usd);

    const adjustmentUsd = add(principalAdjustmentUsd, subtract(context.quotedRainbowFeeUsd, collectedFeeUsd));
    const settlementRead = polymarketBalanceActions.finalizeExpectedBalanceDelta({
      adjustmentUsd,
      operationId: orderId,
      proxyWallet: proxyAddress,
    });
    await refetchPolymarketStores(proxyAddress, settlementRead);
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

// ============ Position Presentation ========================================== //

async function loadSportsPositionDetails({ event: rawEvent, outcomeIndex }: SportsOrderDetails): Promise<PolymarketOrderDetails> {
  const [event, teams] = await Promise.all([processRawPolymarketEvent(rawEvent), fetchTeamsForEvent(rawEvent)]);
  return { event: { ...event, teams }, market: event.markets[0], outcomeIndex };
}

function isSportsOrderDetails(details: PolymarketOrderDetails | SportsOrderDetails): details is SportsOrderDetails {
  return !('color' in details.market);
}

// ============ Order Matching ================================================= //

async function pollForMatchedOrder(
  client: ClobClient,
  orderResult: SuccessfulOrderResult,
  context: OrderContext,
  acceptedAmounts: PolymarketOrderAmounts | undefined
): Promise<PolymarketOrderMatch> {
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
          trackOrderMatchFailedAnalytics(context, { orderId, reason: settlement.status, status: settlement.status });
          return { status: 'notMatched' };
        }

        if (amounts && settlement.status === 'resolved') {
          return { amounts, status: 'matched', transactionHashes: settlement.transactionHashes };
        }
      }

      if (TERMINAL_FAILURE_STATUSES.has(status)) {
        trackOrderMatchFailedAnalytics(context, { orderId, reason: status, status });
        return { status: 'notMatched' };
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
