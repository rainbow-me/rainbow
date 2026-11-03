import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketOrderClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderResult, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { type PolymarketVersion } from '@/features/polymarket/types/polymarket-event';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { getHeldTokenVersion, type HeldPolymarketToken } from '@/features/polymarket/utils/marketProtocol';
import { reconcileAcceptedPolymarketOrder, type MatchedOrderMetadata } from '@/features/polymarket/utils/polymarketOrderReconciliation';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { RainbowError } from '@/logger';

// ============ Types ========================================================== //

/**
 * Buy-position processing states used while executing and confirming an order.
 */
export type PolymarketBuyPositionStep = 'preparing' | 'placing_order' | 'confirming_order';

type ExecutePolymarketBuyPositionParams = {
  version: PolymarketVersion;
  amount: string | number;
  negRisk: boolean;
  price: string | number;
  tokenId: string;
  matchedOrderMetadata: MatchedOrderMetadata;
  onStep?: (step: PolymarketBuyPositionStep) => void;
};

type ExecutePolymarketSellPositionParams = {
  matchedOrderMetadata: MatchedOrderMetadata;
  position: HeldPolymarketToken & {
    proxyWallet: Address;
    negativeRisk: boolean;
    size: number;
  };
  price: string | number;
};

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
  version,
  matchedOrderMetadata,
  onStep,
}: ExecutePolymarketBuyPositionParams): Promise<SuccessfulOrderResult> {
  const routing = getOrderRouting(tokenId, version, negRisk);
  onStep?.('preparing');

  const { clobClient: client, wallet } = await getPolymarketOrderClients();

  try {
    await ensureTradingApprovals(client, wallet, version, Side.BUY);
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'trading_approval_failed');
  }

  try {
    const amount = await getPolygonUsdcBalance(wallet.address);
    if (!amount.isZero()) {
      await wrapUsdcToPusd({ amount, wallet });
      await refetchPolymarketBalance(wallet.address);
    }
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'collateral_conversion_failed');
  }

  onStep?.('placing_order');

  await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  const spendCap = Number(amount);
  const userBalance = Number(usePolymarketBalanceStore.getState().getBalance(wallet.address));

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.BUY,
      ...routing.asset,
      amount: spendCap,
      price: Number(price),
      userUSDCBalance: Math.min(userBalance, spendCap),
    },
    routing.options,
    OrderType.FOK
  );
  const orderResult = resolveSuccessfulOrderResult(result);

  void reconcileAcceptedPolymarketOrder({
    client,
    wallet,
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
  const { clobClient: client, wallet } = await getPolymarketOrderClients(position.proxyWallet);

  const version = await getHeldTokenVersion(position);
  const routing = getOrderRouting(position.asset, version, position.negativeRisk);
  await ensureTradingApprovals(client, wallet, version, Side.SELL);
  await client.updateBalanceAllowance({
    asset_type: version === 'v2' ? 'CONDITIONAL-V2' : AssetType.CONDITIONAL,
    token_id: position.asset,
  });

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.SELL,
      ...routing.asset,
      amount: Number(position.size),
      price: Number(price),
    },
    routing.options,
    OrderType.FOK
  );
  const orderResult = resolveSuccessfulOrderResult(result);

  void reconcileAcceptedPolymarketOrder({
    client,
    wallet,
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

function getOrderRouting(id: string, version: PolymarketVersion, negRisk: boolean) {
  if (!/^\d+$/.test(id)) throw new RainbowError('[polymarket] Invalid trading asset ID');
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
