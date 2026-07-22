import { AssetType, OrderType, Side, type ClobClient, type OpenOrder } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderResult, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { getPolygonUsdcBalance, wrapUsdcAmountToPusd } from '@/features/polymarket/utils/collateral';
import { collectPolymarketTradeFee, type SettlementTransactionHashes } from '@/features/polymarket/utils/collectPolymarketTradeFee';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { divWorklet, mulWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { ensureError, RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { delay } from '@/utils/delay';

// ============ Types ========================================================== //

/**
 * Buy-position processing states used while executing and confirming an order.
 */
export type PolymarketBuyPositionStep = 'preparing' | 'placing_order' | 'confirming_order';

type MarketBuyOrderParams = {
  amount: string | number;
  negRisk: boolean;
  price: string | number;
  tokenId: string;
};

type MatchedOrderMetadata = {
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

type ExecutePolymarketBuyPositionParams = MarketBuyOrderParams & {
  matchedOrderMetadata: MatchedOrderMetadata;
  onStep?: (step: PolymarketBuyPositionStep) => void;
};

type ExecutePolymarketSellPositionParams = {
  matchedOrderMetadata: MatchedOrderMetadata;
  position: {
    asset: string;
    negativeRisk: boolean;
    size: number;
  };
  price: string | number;
};

type MatchedOrderAmounts = {
  tokens: string;
  usd: string;
};

type MatchedOrderSettlement =
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'resolved'; transactionHashes: SettlementTransactionHashes };

// ============ Constants ====================================================== //

const POLL_INTERVAL = time.seconds(1);
const POLL_TIMEOUT = time.minutes(2);

const MATCHED_STATUS = 'matched';
const TERMINAL_FAILURE_STATUSES: readonly string[] = ['canceled', 'expired', 'failed', 'rejected'];

// ============ Execution ====================================================== //

/**
 * Executes a Polymarket buy market order and starts matched-order analytics and
 * trade fee collection after the CLOB accepts the order.
 */
export async function executePolymarketBuyPosition({
  tokenId,
  amount,
  price,
  negRisk,
  matchedOrderMetadata,
  onStep,
}: ExecutePolymarketBuyPositionParams): Promise<SuccessfulOrderResult> {
  onStep?.('preparing');

  const owner = useWalletsStore.getState().accountAddress;
  if (!owner) throw new RainbowError('[polymarket] No active account address');

  const { address: proxyAddress } = await getPolymarketWallet(owner);
  const client = await getPolymarketClobClient();

  try {
    await ensureTradingApprovals();
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'trading_approval_failed');
  }

  try {
    await convertPolymarketCollateralIfNeeded(proxyAddress);
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'collateral_conversion_failed');
  }

  onStep?.('placing_order');

  await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  const orderResult = await placePolymarketMarketBuyOrder({ client, tokenId, amount, price, negRisk });

  startMatchedOrderFeeCollection({
    orderResult,
    context: {
      ...matchedOrderMetadata,
      side: 'buy',
      tokenId,
    },
  });

  return orderResult;
}

/**
 * Executes a Polymarket sell market order for the full position and starts
 * matched-order analytics and trade fee collection after the CLOB accepts the
 * order.
 */
export async function executePolymarketSellPosition({
  matchedOrderMetadata,
  position,
  price,
}: ExecutePolymarketSellPositionParams): Promise<SuccessfulOrderResult> {
  const client = await getPolymarketClobClient();
  await ensureTradingApprovals();
  await client.updateBalanceAllowance({ asset_type: AssetType.CONDITIONAL, token_id: position.asset });

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.SELL,
      tokenID: position.asset,
      amount: Number(position.size),
      price: Number(price),
    },
    { negRisk: position.negativeRisk },
    OrderType.FOK
  );
  const orderResult = resolveSuccessfulOrderResult(result);

  startMatchedOrderFeeCollection({
    orderResult,
    context: {
      ...matchedOrderMetadata,
      side: 'sell',
      tokenId: position.asset,
    },
  });

  return orderResult;
}

// ============ Execution Helpers ============================================= //

async function convertPolymarketCollateralIfNeeded(proxyAddress: Address): Promise<void> {
  const usdcBalance = await getPolygonUsdcBalance(proxyAddress);
  if (usdcBalance.isZero()) return;

  await wrapUsdcAmountToPusd({ proxyAddress, amount: usdcBalance });
}

async function placePolymarketMarketBuyOrder({
  client,
  tokenId,
  amount,
  price,
  negRisk,
}: MarketBuyOrderParams & { client: ClobClient }): Promise<SuccessfulOrderResult> {
  const spendCap = typeof amount === 'number' ? amount : Number(amount);
  const userBalance = Number(usePolymarketBalanceStore.getState().getBalance());

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.BUY,
      tokenID: tokenId,
      amount: spendCap,
      price: typeof price === 'number' ? price : Number(price),
      userUSDCBalance: Math.min(userBalance, spendCap),
    },
    { negRisk },
    OrderType.FOK
  );

  return resolveSuccessfulOrderResult(result);
}

function resolveSuccessfulOrderResult(result: PolymarketOrderResult): SuccessfulOrderResult {
  if ('error' in result || !result.success || result.errorMsg) {
    throw new RainbowError('error' in result ? result.error : result.errorMsg || 'Order was not successful');
  }

  return result;
}

// ============ Matched Order Fees ============================================= //

function startMatchedOrderFeeCollection({ orderResult, context }: { orderResult: SuccessfulOrderResult; context: MatchedOrderContext }) {
  const { orderID: orderId } = orderResult;
  const immediateAmounts = getMatchedAmountsFromAcceptedOrder(orderResult, context.side);
  const settlementTransactionHashes = toSettlementTransactionHashes(orderResult.transactionsHashes);

  if (immediateAmounts && settlementTransactionHashes) {
    recordMatchedOrderAndCollectFee(context, immediateAmounts, orderId, settlementTransactionHashes);
    return;
  }

  void pollForMatchedOrderFeeCollection({ orderId, initialStatus: orderResult.status?.toLowerCase() ?? '', context });
}

async function pollForMatchedOrderFeeCollection({
  orderId,
  initialStatus,
  context,
}: {
  orderId: string;
  initialStatus: string;
  context: MatchedOrderContext;
}) {
  let status = initialStatus;

  try {
    const client = await getPolymarketClobClient();
    const startedAt = Date.now();

    while (Date.now() - startedAt < POLL_TIMEOUT) {
      const order = await client.getOrder(orderId);
      status = order.status.toLowerCase();

      if (status === MATCHED_STATUS) {
        const amounts = getMatchedAmountsFromPolledOrder(order);
        const settlement = await getMatchedOrderSettlement(client, order.associate_trades);

        if (settlement.status === 'failed') {
          trackOrderMatchFailedAnalytics({ orderId, context, reason: settlement.status, status: settlement.status });
          return;
        }
        if (amounts && settlement.status === 'resolved') {
          recordMatchedOrderAndCollectFee(context, amounts, orderId, settlement.transactionHashes);
          return;
        }
      }

      if (TERMINAL_FAILURE_STATUSES.includes(status)) {
        trackOrderMatchFailedAnalytics({ orderId, context, reason: status, status });
        return;
      }

      await delay(POLL_INTERVAL);
    }

    trackOrderMatchFailedAnalytics({ orderId, context, reason: 'timeout', status });
  } catch (e) {
    trackOrderMatchFailedAnalytics({ orderId, context, reason: 'error', status, errorMessage: ensureError(e).message });
  }
}

function recordMatchedOrderAndCollectFee(
  context: MatchedOrderContext,
  amounts: MatchedOrderAmounts,
  orderId: string,
  settlementTransactionHashes: SettlementTransactionHashes
) {
  trackMatchedOrderAnalytics(context, amounts);

  void collectPolymarketTradeFee({
    matchedAmounts: amounts,
    orderId,
    quotedFeeUsd: context.quotedTradeFeeUsd,
    side: context.side,
    settlementTransactionHashes,
    tokenId: context.tokenId,
  });
}

async function getMatchedOrderSettlement(client: ClobClient, associatedTradeIds: readonly string[]): Promise<MatchedOrderSettlement> {
  const tradeIds = associatedTradeIds.filter(id => id.length > 0);
  const trades = await Promise.all(tradeIds.map(async id => (await client.getTrades({ id }, true)).find(trade => trade.id === id)));
  let transactionHashes: SettlementTransactionHashes | undefined;

  for (const trade of trades) {
    if (trade === undefined) return { status: 'pending' };
    if (trade.status.toLowerCase() === 'failed') return { status: 'failed' };

    const transactionHash = trade.transaction_hash;
    if (transactionHash === undefined || transactionHash.length === 0) return { status: 'pending' };

    transactionHashes = transactionHashes === undefined ? [transactionHash] : [...transactionHashes, transactionHash];
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
