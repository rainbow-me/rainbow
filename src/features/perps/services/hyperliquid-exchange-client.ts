import { divide } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { OrderParams } from '@nktkas/hyperliquid/script/src/types/mod';
import { Address, Hex } from 'viem';
import { DEFAULT_SLIPPAGE_BIPS, RAINBOW_BUILDER_SETTINGS } from '../constants';
import { PositionSide, OrderType } from '../types';
import { hyperliquidMarketsClient } from './hyperliquid-markets-client';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { getOppositePositionSide } from '../utils';
import { RainbowError } from '@/logger';
import { Wallet } from '@ethersproject/wallet';
import { LedgerSigner } from '@/handlers/LedgerSigner';

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
      amount,
      destination: this.userAddress,
    });
  }

  async createOrder({
    assetId,
    assetSymbol,
    side,
    usdAmount,
    size,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    limitPrice,
    orderType,
    reduceOnly,
    clientOrderId,
  }: {
    assetId: number;
    assetSymbol: string;
    side: PositionSide;
    usdAmount?: string;
    size?: string;
    slippageBips?: number;
    limitPrice?: string;
    orderType: OrderType;
    reduceOnly?: boolean;
    clientOrderId?: Hex;
  }): Promise<OrderParams> {
    if (!usdAmount && !size) {
      throw new RainbowError('[HyperliquidExchangeClient] Either usdAmount or size must be provided');
    }
    if (usdAmount && size) {
      throw new RainbowError('[HyperliquidExchangeClient] Cannot provide both usdAmount and size');
    }

    const [midPrice] = await hyperliquidMarketsClient.getAssetPricesBySymbol([assetSymbol]);

    if (!midPrice) {
      throw new RainbowError('[HyperliquidExchangeClient] Unable to get market price', { assetSymbol });
    }

    let orderPrice = limitPrice;
    if (orderType === 'MARKET' && !orderPrice) {
      const slippage = slippageBips / 10_000;
      const slippageMultiplier = 1 + slippage;

      orderPrice =
        side === 'LONG' ? (parseFloat(midPrice) * slippageMultiplier).toFixed(8) : (parseFloat(midPrice) / slippageMultiplier).toFixed(8);
    }

    if (!orderPrice) {
      throw new RainbowError('[HyperliquidExchangeClient] Order price is required', { orderType });
    }

    let orderSize: string;
    if (size) {
      orderSize = size;
    } else {
      const priceToUse = orderPrice || midPrice;
      orderSize = divide(usdAmount as string, priceToUse);
    }

    return {
      a: assetId,
      b: side === 'LONG',
      p: orderPrice,
      s: orderSize,
      r: reduceOnly ?? false,
      t: orderType === 'MARKET' ? { limit: { tif: 'Ioc' } } : { limit: { tif: 'Gtc' } },
      c: clientOrderId,
    };
  }

  /**
   * Create a trigger order (stop loss or take profit)
   */
  private createTriggerOrder({
    assetId,
    side,
    size,
    triggerPrice,
    orderPrice,
    isMarket,
    type,
  }: {
    assetId: number;
    side: PositionSide;
    size: string;
    triggerPrice: string;
    orderPrice: string;
    isMarket: boolean;
    type: 'tp' | 'sl';
  }): OrderParams {
    return {
      a: assetId,
      b: side !== 'LONG',
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

  /**
   * Open a new isolated margin position
   */
  async openIsolatedMarginPosition({
    symbol,
    side,
    usdAmount,
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
    side: PositionSide;
    usdAmount: string;
    leverage: number;
    orderType: OrderType;
    limitPrice?: string;
    slippageBips?: number;
    reduceOnly?: boolean;
    clientOrderId?: Hex;
    stopLossPrice?: string;
    takeProfitPrice?: string;
  }): Promise<hl.OrderSuccessResponse> {
    const assetId = await hyperliquidMarketsClient.getAssetId(symbol);

    await this.exchangeClient.updateLeverage({
      asset: assetId,
      isCross: false,
      leverage,
    });

    const mainOrder = await this.createOrder({
      assetId,
      assetSymbol: symbol,
      side,
      usdAmount,
      slippageBips,
      orderType,
      limitPrice,
      reduceOnly,
      clientOrderId,
    });

    const orders: OrderParams[] = [mainOrder];

    if (stopLossPrice) {
      const stopLossOrder = this.createTriggerOrder({
        assetId,
        side,
        size: mainOrder.s,
        triggerPrice: stopLossPrice,
        orderPrice: stopLossPrice,
        isMarket: true,
        type: 'sl',
      });
      orders.push(stopLossOrder);
    }

    if (takeProfitPrice) {
      const takeProfitOrder = this.createTriggerOrder({
        assetId,
        side,
        size: mainOrder.s,
        triggerPrice: takeProfitPrice,
        orderPrice: takeProfitPrice,
        isMarket: false,
        type: 'tp',
      });
      orders.push(takeProfitOrder);
    }

    const grouping = stopLossPrice || takeProfitPrice ? 'positionTpsl' : 'na';

    return await this.exchangeClient.order({
      orders,
      grouping,
      builder: RAINBOW_BUILDER_SETTINGS,
    });
  }

  /**
   * Close an isolated position
   * This will close the position and cancel any related stop loss and take profit orders
   */
  async closeIsolatedMarginPosition({
    symbol,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    clientOrderId,
  }: {
    symbol: string;
    slippageBips?: number;
    clientOrderId?: Hex;
  }): Promise<void> {
    const accountSummary = await this.accountClient.getPerpAccountSummary();
    const position = accountSummary.positions.find(p => p.symbol === symbol);

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

    const closeOrder = await this.createOrder({
      assetId,
      assetSymbol: symbol,
      side: getOppositePositionSide(position.side),
      size: positionSize,
      slippageBips,
      orderType: 'MARKET',
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
