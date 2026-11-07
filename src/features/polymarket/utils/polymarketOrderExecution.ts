import { AssetType, OrderType, Side, type ClobClient } from '@polymarket/clob-client-v2';

import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions, usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { type PolymarketOrderDetails, type SportsOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { type PolymarketOrderResult, type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { type PolymarketMarket, type PolymarketVersion } from '@/features/polymarket/types/polymarket-event';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { getHeldTokenVersion, isPolymarketTokenId } from '@/features/polymarket/utils/marketProtocol';
import {
  reconcileAcceptedPolymarketOrder,
  waitForDelayedOrder,
  type AcceptedOrder,
  type OrderContext,
  type OrderQuote,
} from '@/features/polymarket/utils/polymarketOrderReconciliation';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { subWorklet, sumWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

// ============ Types ========================================================== //

type PolymarketOrderSubmissionResult = SuccessfulOrderResult & { followUp: Promise<void> };

type ExecutePolymarketBuyPositionParams = (PolymarketOrderDetails | SportsOrderDetails) & {
  orderSpendCap: string;
  orderQuote: OrderQuote;
};

type ExecutePolymarketSellPositionParams = {
  orderQuote: OrderQuote;
  position: PolymarketPosition;
};

// ============ Constants ====================================================== //

const DELAYED_ORDER_SLIPPAGE_USD = '0.01';
const FILL_VISIBILITY_GRACE = time.seconds(2);

// ============ Execution ====================================================== //

/**
 * Submits a buy and waits briefly for an exchange fill.
 * A `delayed` result remains unconfirmed; `followUp` continues observation,
 * position and balance updates, settlement, and fee collection.
 */
export async function executePolymarketBuyPosition(params: ExecutePolymarketBuyPositionParams): Promise<PolymarketOrderSubmissionResult> {
  const { orderSpendCap, orderQuote, ...details } = params;
  const { event, market, outcomeIndex } = details;
  const tokenId = market.clobTokenIds[outcomeIndex];
  const price = getOrderPriceLimit(orderQuote.orderPriceUsd, Side.BUY, market, tokenId);
  const routing = getOrderRouting(tokenId, market.version, market.negRisk);
  const { clobClient: client, wallet } = await getPolymarketOrderClients();
  const proxyAddress = wallet.address;

  try {
    await ensureTradingApprovals(client, wallet, market.version, Side.BUY);
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'trading_approval_failed');
  }

  try {
    const usdcBalance = await getPolygonUsdcBalance(proxyAddress);
    if (!usdcBalance.isZero()) {
      await wrapUsdcToPusd({ amount: usdcBalance, wallet });
      await refetchPolymarketBalance(proxyAddress);
    }
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'collateral_conversion_failed');
  }

  await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });

  const balanceUpdate = polymarketBalanceActions.beginUpdate(proxyAddress);
  const positionUpdate = polymarketPositionsActions.beginBuy({ asset: tokenId, proxyAddress });
  let order: AcceptedOrder;

  try {
    const orderSpendCapUsd = Number(orderSpendCap);
    const quotedNotionalUsd = Number(orderQuote.expectedAmounts.usd);
    const userBalanceUsd = Number(usePolymarketBalanceStore.getState().getBalance(proxyAddress));
    const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
      {
        side: Side.BUY,
        ...routing.asset,
        amount: market.secondsDelay > 0 ? Math.min(orderSpendCapUsd, quotedNotionalUsd) : orderSpendCapUsd,
        price,
        userUSDCBalance: Math.min(userBalanceUsd, orderSpendCapUsd),
      },
      routing.options,
      OrderType.FOK
    );
    order = await resolveSuccessfulOrderResult(client, result, market.conditionId, market.secondsDelay);
  } catch (error) {
    positionUpdate.discard();
    balanceUpdate.discard();
    throw error;
  }

  const context: OrderContext = {
    ...details,
    ...orderQuote,
    orderPriceUsd: String(price),
    eventSlug: event.slug,
    marketSlug: market.slug,
    outcome: market.outcomes[outcomeIndex],
    side: 'buy',
    tokenId,
    positionUpdate,
  };

  return {
    ...order.response,
    followUp: reconcileAcceptedPolymarketOrder({ order, balanceUpdate, client, context, wallet }),
  };
}

/**
 * Submits a sale of the full position and waits briefly for an exchange fill.
 * A `delayed` result remains unconfirmed; `followUp` continues observation,
 * position and balance updates, settlement, and fee collection.
 */
export async function executePolymarketSellPosition({
  orderQuote,
  position,
}: ExecutePolymarketSellPositionParams): Promise<PolymarketOrderSubmissionResult> {
  const { clobClient: client, wallet } = await getPolymarketOrderClients(position.proxyWallet);

  const price = getOrderPriceLimit(orderQuote.orderPriceUsd, Side.SELL, position.market, position.asset);
  const version = await getHeldTokenVersion(position);
  const routing = getOrderRouting(position.asset, version, position.negativeRisk);

  await ensureTradingApprovals(client, wallet, version, Side.SELL);
  await client.updateBalanceAllowance({
    asset_type: version === 'v2' ? 'CONDITIONAL-V2' : AssetType.CONDITIONAL,
    token_id: position.asset,
  });

  const balanceUpdate = polymarketBalanceActions.beginUpdate(wallet.address);
  let order: AcceptedOrder;

  try {
    const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
      { side: Side.SELL, ...routing.asset, amount: Number(position.size), price },
      routing.options,
      OrderType.FOK
    );
    order = await resolveSuccessfulOrderResult(client, result, position.conditionId, position.market.secondsDelay);
  } catch (error) {
    balanceUpdate.discard();
    throw error;
  }

  const context: OrderContext = {
    ...orderQuote,
    orderPriceUsd: String(price),
    eventSlug: position.eventSlug,
    marketSlug: position.slug,
    outcome: position.outcome,
    side: 'sell',
    tokenId: position.asset,
    position,
  };

  return {
    ...order.response,
    followUp: reconcileAcceptedPolymarketOrder({ order, balanceUpdate, client, context, wallet }),
  };
}

// ============ Execution Helpers ============================================= //

function getOrderPriceLimit(
  price: string,
  side: Side,
  market: Pick<PolymarketMarket, 'secondsDelay' | 'orderPriceMinTickSize'>,
  tokenId: string
): number {
  if (market.secondsDelay <= 0) return Number(price);

  const book = usePolymarketOrderBookStore.getState().getData({ tokenId });
  const tick = Number(book?.tick_size ?? market.orderPriceMinTickSize);

  return side === Side.BUY
    ? Math.min(1 - tick, Number(sumWorklet(price, DELAYED_ORDER_SLIPPAGE_USD)))
    : Math.max(tick, Number(subWorklet(price, DELAYED_ORDER_SLIPPAGE_USD)));
}

function getOrderRouting(id: string, version: PolymarketVersion, negRisk: boolean) {
  if (!isPolymarketTokenId(id)) throw new RainbowError('[polymarket] Invalid trading asset ID');

  if (version === 'v1') return { asset: { tokenID: id }, options: { version: 2, negRisk } } as const;
  if (version === 'v2') return { asset: { positionID: id } } as const;

  throw new RainbowError('[polymarket] Unsupported market version');
}

async function resolveSuccessfulOrderResult(
  client: ClobClient,
  response: PolymarketOrderResult,
  market: string,
  secondsDelay: number
): Promise<AcceptedOrder> {
  const containsError = 'error' in response;

  if (containsError || !response.success || response.errorMsg) {
    throw new RainbowError(containsError ? response.error : response.errorMsg || 'Order was not successful');
  }

  if (response.status?.toLowerCase() !== 'delayed') return { response };

  const pendingFill = waitForDelayedOrder(client, response.orderID, market, secondsDelay);
  const fill = await Promise.race([pendingFill, delay(time.seconds(secondsDelay) + FILL_VISIBILITY_GRACE)]);

  return { response: { ...response, status: fill ? 'matched' : 'delayed' }, pendingFill };
}
