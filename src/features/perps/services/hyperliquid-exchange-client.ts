import { divide, multiply } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { OrderParams } from '@nktkas/hyperliquid/script/src/types/mod';
import { Address, Hex } from 'viem';
import { DEFAULT_SLIPPAGE_BIPS, RAINBOW_BUILDER_SETTINGS } from '../constants';
import { PerpPositionSide, OrderType, TriggerOrderType } from '../types';
import { hyperliquidMarketsClient } from './hyperliquid-markets-client';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { getOppositePositionSide } from '../utils';
import { RainbowError } from '@/logger';
import { Wallet } from '@ethersproject/wallet';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { toFixedWorklet } from '@/safe-math/SafeMath';

function createTriggerOrder({
  assetId,
  side,
  size,
  triggerPrice,
  orderPrice,
  isMarket,
  type,
}: {
  assetId: number;
  side: PerpPositionSide;
  size: string;
  triggerPrice: string;
  orderPrice: string;
  isMarket: boolean;
  type: TriggerOrderType;
}): OrderParams {
  return {
    a: assetId,
    b: side !== PerpPositionSide.LONG,
    p: orderPrice,
    s: size,
    r: true,
    t: {
      trigger: {
        isMarket,
        triggerPx: triggerPrice,
        tpsl: type,
      },
    },
  };
}

function createOrder({
  assetId,
  side,
  size,
  assetPrice,
  slippageBips = DEFAULT_SLIPPAGE_BIPS,
  limitPrice,
  orderType,
  reduceOnly,
  clientOrderId,
}: {
  assetId: number;
  side: PerpPositionSide;
  size: string;
  assetPrice: string;
  slippageBips?: number;
  limitPrice?: string;
  orderType: OrderType;
  reduceOnly?: boolean;
  clientOrderId?: Hex;
}): OrderParams {
  let orderPrice = limitPrice;
  if (orderType === OrderType.MARKET && !orderPrice) {
    const slippage = slippageBips / 10_000;
    const slippageMultiplier = 1 + slippage;

    orderPrice =
      side === PerpPositionSide.LONG
        ? (parseFloat(assetPrice) * slippageMultiplier).toFixed(8)
        : (parseFloat(assetPrice) / slippageMultiplier).toFixed(8);
  }

  if (!orderPrice) {
    throw new RainbowError('[HyperliquidExchangeClient] Order price is required', { orderType });
  }

  return {
    a: assetId,
    b: side === PerpPositionSide.LONG,
    p: orderPrice,
    // asset denominated size
    s: size,
    r: reduceOnly ?? false,
    t: orderType === OrderType.MARKET ? { limit: { tif: 'Ioc' } } : { limit: { tif: 'Gtc' } },
    c: clientOrderId,
  };
}

export class HyperliquidExchangeClient {
  private exchangeClient: hl.ExchangeClient;
  private accountClient: HyperliquidAccountClient;

  constructor(
    private userAddress: Address,
    wallet: Wallet
  ) {
    this.exchangeClient = new hl.ExchangeClient({
      transport: new hl.HttpTransport(),
      wallet: wallet,
    });
    this.accountClient = new HyperliquidAccountClient(userAddress);
  }

  async deposit(amount: string) {}

  async withdraw(amount: string) {
    await this.exchangeClient.withdraw3({
      destination: this.userAddress,
      amount,
    });
  }

  /**
   * Open a new isolated margin position
   */
  async openIsolatedMarginPosition({
    symbol,
    side,
    marginAmount,
    decimals,
    assetPrice,
    leverage,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    orderType,
    limitPrice,
    reduceOnly,
    clientOrderId,
    stopLossPrice,
    takeProfitPrice,
  }: {
    symbol: string;
    side: PerpPositionSide;
    marginAmount: string;
    assetPrice: string;
    leverage: number;
    decimals: number;
    orderType: OrderType;
    limitPrice?: string;
    slippageBips?: number;
    reduceOnly?: boolean;
    clientOrderId?: Hex;
    stopLossPrice?: string;
    takeProfitPrice?: string;
  }): Promise<hl.OrderSuccessResponse> {
    // TODO (kane): we should cache this / fetch it on page load
    const assetId = await hyperliquidMarketsClient.getAssetId(symbol);

    // TODO: technically we should not call this if the leverage is already set to the desired value
    await this.exchangeClient.updateLeverage({
      asset: assetId,
      isCross: false,
      leverage,
    });

    // Calculate position size from margin amount, leverage, and asset price
    const positionValue = multiply(marginAmount, leverage);
    const positionSize = toFixedWorklet(divide(positionValue, assetPrice), decimals);

    const mainOrder = createOrder({
      assetId,
      side,
      size: positionSize,
      assetPrice,
      slippageBips,
      orderType,
      limitPrice: limitPrice ?? assetPrice,
      reduceOnly,
      clientOrderId,
    });

    const orders: OrderParams[] = [mainOrder];

    if (stopLossPrice) {
      const stopLossOrder = createTriggerOrder({
        assetId,
        side,
        size: mainOrder.s,
        triggerPrice: stopLossPrice,
        orderPrice: stopLossPrice,
        isMarket: true,
        type: TriggerOrderType.STOP_LOSS,
      });
      orders.push(stopLossOrder);
    }

    if (takeProfitPrice) {
      const takeProfitOrder = createTriggerOrder({
        assetId,
        side,
        size: mainOrder.s,
        triggerPrice: takeProfitPrice,
        orderPrice: takeProfitPrice,
        isMarket: false,
        type: TriggerOrderType.TAKE_PROFIT,
      });
      orders.push(takeProfitOrder);
    }

    const grouping = stopLossPrice || takeProfitPrice ? 'positionTpsl' : 'na';

    return await this.exchangeClient.order({
      orders,
      grouping,
      // TODO: blocked, account needs to be created
      // builder: RAINBOW_BUILDER_SETTINGS,
    });
  }

  /**
   * Close an isolated position
   * This will close the position and cancel any related stop loss and take profit orders
   */
  async closeIsolatedMarginPosition({
    symbol,
    assetPrice,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    clientOrderId,
  }: {
    symbol: string;
    assetPrice: string;
    slippageBips?: number;
    clientOrderId?: Hex;
  }): Promise<void> {
    const account = await this.accountClient.getPerpAccount();
    const position = account.positions.find(p => p.symbol === symbol);

    if (!position) {
      throw new RainbowError('[HyperliquidExchangeClient] No open position found', { symbol });
    }

    const assetId = await hyperliquidMarketsClient.getAssetId(symbol);
    const orderIdsToCancel: { a: number; o: number }[] = [];

    if (position.stopLoss?.orders) {
      for (const order of position.stopLoss.orders) {
        if (order.oid) {
          orderIdsToCancel.push({ a: assetId, o: order.oid });
        }
      }
    }

    if (position.takeProfit?.orders) {
      for (const order of position.takeProfit.orders) {
        if (order.oid) {
          orderIdsToCancel.push({ a: assetId, o: order.oid });
        }
      }
    }

    if (orderIdsToCancel.length > 0) {
      await this.exchangeClient.cancel({ cancels: orderIdsToCancel });
    }

    const nativeInfoClient = new hl.InfoClient({
      transport: new hl.HttpTransport(),
    });

    const perpState = await nativeInfoClient.clearinghouseState({
      user: this.userAddress,
    });
    const assetPosition = perpState.assetPositions.find(ap => ap.position.coin === symbol);

    if (!assetPosition) {
      throw new RainbowError('[HyperliquidExchangeClient] Position data not found', { symbol });
    }

    const positionSize = Math.abs(parseFloat(assetPosition.position.szi)).toString();

    const closeOrder = createOrder({
      assetId,
      side: getOppositePositionSide(position.side),
      size: positionSize,
      assetPrice,
      slippageBips,
      orderType: OrderType.MARKET,
      reduceOnly: true,
      clientOrderId,
    });

    await this.exchangeClient.order({
      orders: [closeOrder],
      grouping: 'na',
      builder: RAINBOW_BUILDER_SETTINGS,
    });
  }
}
