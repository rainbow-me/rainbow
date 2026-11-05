import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';

import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions, usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderDetails, type SportsOrderDetails } from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { type PolymarketOrderResult, type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { type PolymarketVersion } from '@/features/polymarket/types/polymarket-event';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { getHeldTokenVersion, isPolymarketTokenId } from '@/features/polymarket/utils/marketProtocol';
import {
  getMatchedAmountsFromAcceptedOrder,
  reconcileAcceptedPolymarketOrder,
  type OrderContext,
  type OrderQuote,
} from '@/features/polymarket/utils/polymarketOrderReconciliation';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { RainbowError } from '@/logger';

// ============ Types ========================================================== //

type PolymarketOrderSubmissionResult = SuccessfulOrderResult & { followUp: Promise<void> };

type ExecutePolymarketBuyPositionParams = (PolymarketOrderDetails | SportsOrderDetails) & {
  amount: string;
  orderQuote: OrderQuote;
};

type ExecutePolymarketSellPositionParams = {
  orderQuote: OrderQuote;
  position: PolymarketPosition;
};

// ============ Execution ====================================================== //

/**
 * Submits a buy and publishes its accepted balance estimate.
 * Position updates, settlement, fees, and reconciliation continue through the returned follow-up.
 */
export async function executePolymarketBuyPosition(params: ExecutePolymarketBuyPositionParams): Promise<PolymarketOrderSubmissionResult> {
  const { amount, orderQuote, ...details } = params;
  const { event, market, outcomeIndex } = details;
  const tokenId = market.clobTokenIds[outcomeIndex];
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

  let orderResult: SuccessfulOrderResult;
  try {
    const spendCap = Number(amount);
    const userBalance = Number(usePolymarketBalanceStore.getState().getBalance(proxyAddress));
    const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
      {
        side: Side.BUY,
        ...routing.asset,
        amount: spendCap,
        price: Number(orderQuote.orderPriceUsd),
        userUSDCBalance: Math.min(userBalance, spendCap),
      },
      routing.options,
      OrderType.FOK
    );
    orderResult = resolveSuccessfulOrderResult(result);
  } catch (error) {
    positionUpdate.discard();
    balanceUpdate.discard();
    throw error;
  }

  const context: OrderContext = {
    ...details,
    ...orderQuote,
    eventSlug: event.slug,
    marketSlug: market.slug,
    outcome: market.outcomes[outcomeIndex],
    side: 'buy',
    tokenId,
    positionUpdate,
  };

  return {
    ...orderResult,
    followUp: reconcileAcceptedPolymarketOrder({
      acceptedAmounts: getMatchedAmountsFromAcceptedOrder(orderResult, context.side),
      balanceUpdate,
      client,
      context,
      orderResult,
      wallet,
    }),
  };
}

/**
 * Sells the full position and publishes its accepted removal and balance estimate.
 * Settlement, fees, and reconciliation continue through the returned follow-up.
 */
export async function executePolymarketSellPosition({
  orderQuote,
  position,
}: ExecutePolymarketSellPositionParams): Promise<PolymarketOrderSubmissionResult> {
  const { clobClient: client, wallet } = await getPolymarketOrderClients(position.proxyWallet);

  const version = await getHeldTokenVersion(position);
  const routing = getOrderRouting(position.asset, version, position.negativeRisk);

  await ensureTradingApprovals(client, wallet, version, Side.SELL);
  await client.updateBalanceAllowance({
    asset_type: version === 'v2' ? 'CONDITIONAL-V2' : AssetType.CONDITIONAL,
    token_id: position.asset,
  });

  const balanceUpdate = polymarketBalanceActions.beginUpdate(wallet.address);

  let orderResult: SuccessfulOrderResult;
  try {
    const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
      { side: Side.SELL, ...routing.asset, amount: Number(position.size), price: Number(orderQuote.orderPriceUsd) },
      routing.options,
      OrderType.FOK
    );
    orderResult = resolveSuccessfulOrderResult(result);
  } catch (error) {
    balanceUpdate.discard();
    throw error;
  }

  const context: OrderContext = {
    ...orderQuote,
    eventSlug: position.eventSlug,
    marketSlug: position.slug,
    outcome: position.outcome,
    side: 'sell',
    tokenId: position.asset,
    position,
  };

  return {
    ...orderResult,
    followUp: reconcileAcceptedPolymarketOrder({
      acceptedAmounts: getMatchedAmountsFromAcceptedOrder(orderResult, context.side),
      balanceUpdate,
      client,
      context,
      orderResult,
      wallet,
    }),
  };
}

// ============ Execution Helpers ============================================= //

function getOrderRouting(id: string, version: PolymarketVersion, negRisk: boolean) {
  if (!isPolymarketTokenId(id)) throw new RainbowError('[polymarket] Invalid trading asset ID');

  if (version === 'v1') return { asset: { tokenID: id }, options: { version: 2, negRisk } } as const;
  if (version === 'v2') return { asset: { positionID: id } } as const;

  throw new RainbowError('[polymarket] Unsupported market version');
}

function resolveSuccessfulOrderResult(result: PolymarketOrderResult): SuccessfulOrderResult {
  if ('error' in result || !result.success || result.errorMsg) {
    throw new RainbowError('error' in result ? result.error : result.errorMsg || 'Order was not successful');
  }
  return result;
}
