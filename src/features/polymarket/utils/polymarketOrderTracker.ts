import { analytics } from '@/analytics';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { collectTradeFee } from '@/features/polymarket/utils/collectTradeFee';
import { USD_FEE_PER_TOKEN } from '@/features/polymarket/constants';
import { ensureError } from '@/logger';
import { divWorklet, mulWorklet } from '@/framework/core/safeMath';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { OpenOrder } from '@polymarket/clob-client';
import { SuccessfulOrderResult } from '@/features/polymarket/utils/orders';

const POLL_INTERVAL = time.seconds(1);
const POLL_TIMEOUT = time.minutes(2);
const MATCHED_STATUS = 'matched';
// These are not documented anywhere
const TERMINAL_FAILURE_STATUSES = new Set(['canceled', 'expired', 'failed', 'rejected']);

type OrderTrackingContext = {
  eventSlug: string;
  marketSlug: string;
  outcome: string;
  tokenId: string;
  side: 'buy' | 'sell';
  bestPriceUsd: number | string;
  orderPriceUsd: number | string;
  spread?: number | string;
};

type MatchedAmounts = {
  tokens: string;
  usd: string;
};

const inFlight = new Set<string>();

export function trackPolymarketOrder({ orderResult, context }: { orderResult: SuccessfulOrderResult; context: OrderTrackingContext }) {
  const { orderID: orderId } = orderResult;
  if (inFlight.has(orderId)) return;

  const status = orderResult.status?.toLowerCase();
  let matchedAmounts: MatchedAmounts | undefined;

  if (status === MATCHED_STATUS) {
    matchedAmounts =
      context.side === 'buy'
        ? { tokens: orderResult.takingAmount, usd: orderResult.makingAmount }
        : { tokens: orderResult.makingAmount, usd: orderResult.takingAmount };
  }

  if (status === MATCHED_STATUS && matchedAmounts) {
    trackMatchedOrderAndCollectFee(context, matchedAmounts);
    return;
  }

  void pollForMatch({ orderId, initialStatus: status, context });
}

async function pollForMatch({
  orderId,
  initialStatus,
  context,
}: {
  orderId: string;
  initialStatus: string;
  context: OrderTrackingContext;
}) {
  if (inFlight.has(orderId)) return;
  inFlight.add(orderId);
  let status = initialStatus;

  try {
    const client = await getPolymarketClobClient();
    const startedAt = Date.now();

    while (Date.now() - startedAt < POLL_TIMEOUT) {
      const order = await client.getOrder(orderId);
      status = order?.status?.toLowerCase();

      if (status === MATCHED_STATUS) {
        const amounts = getMatchedAmountsFromOrder(order);
        if (amounts) {
          trackMatchedOrderAndCollectFee(context, amounts);
          return;
        }
      }

      if (status && TERMINAL_FAILURE_STATUSES.has(status)) {
        trackOrderMatchFailed({ orderId, context, reason: status, status });
        return;
      }

      await delay(POLL_INTERVAL);
    }

    trackOrderMatchFailed({ orderId, context, reason: 'timeout', status });
  } catch (e) {
    trackOrderMatchFailed({ orderId, context, reason: 'error', status, errorMessage: ensureError(e).message });
  } finally {
    inFlight.delete(orderId);
  }
}

function getMatchedAmountsFromOrder(order: OpenOrder) {
  if (!order?.size_matched || !order?.price) return undefined;
  return {
    tokens: order.size_matched,
    usd: mulWorklet(order.size_matched, order.price),
  };
}

function trackMatchedOrderAndCollectFee(context: OrderTrackingContext, amounts: MatchedAmounts) {
  const feeAmountUsd = mulWorklet(amounts.tokens, USD_FEE_PER_TOKEN);

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

  void collectTradeFee(amounts.tokens);
}

function trackOrderMatchFailed({
  orderId,
  context,
  reason,
  status,
  errorMessage,
}: {
  orderId: string;
  context: OrderTrackingContext;
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
