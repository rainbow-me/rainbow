import { multiply } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { OrderParams } from '@nktkas/hyperliquid/script/src/types/mod';
import { Address, Hex } from 'viem';
import { DEFAULT_SLIPPAGE_BIPS, RAINBOW_BUILDER_SETTINGS } from '../constants';
import { PerpPositionSide, TriggerOrder } from '../types';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { Wallet } from '@ethersproject/wallet';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { formatOrderPrice } from '@/features/perps/utils/formatOrderPrice';
import {
  buildMarketOrder,
  buildMarketTriggerOrder,
  calculatePositionSizeFromMarginAmount,
  getMarketType,
} from '@/features/perps/utils/orders';

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
    assetId,
    side,
    marginAmount,
    sizeDecimals,
    price,
    leverage,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    reduceOnly = false,
    clientOrderId,
    triggerOrders = [],
  }: {
    assetId: number;
    side: PerpPositionSide;
    marginAmount: string;
    sizeDecimals: number;
    price: string;
    leverage: number;
    slippageBips?: number;
    reduceOnly?: boolean;
    clientOrderId?: Hex;
    triggerOrders?: TriggerOrder[];
  }): Promise<hl.OrderSuccessResponse> {
    // TODO (kane): technically we should not call this if the leverage is already set to the desired value
    await this.exchangeClient.updateLeverage({
      asset: assetId,
      isCross: false,
      leverage,
    });

    const marketType = getMarketType(assetId);

    const positionSize = calculatePositionSizeFromMarginAmount({ assetId, marginAmount, leverage, price, sizeDecimals });
    const positionMarketOrder = buildMarketOrder({
      assetId,
      side,
      size: positionSize,
      price,
      sizeDecimals,
      reduceOnly,
      clientOrderId,
    });

    const orders: OrderParams[] = [positionMarketOrder];

    // TODO (kane): cleanup + move to utils/orders.ts
    for (const triggerOrder of triggerOrders) {
      // 0 size is treated as whatever the full position size when the trigger is hit
      const orderSize =
        triggerOrder.orderFraction === '1'
          ? '0'
          : toFixedWorklet(multiply(positionMarketOrder.s, triggerOrder.orderFraction), sizeDecimals);
      const triggerPrice = formatOrderPrice({ price: triggerOrder.price, sizeDecimals, marketType });

      const hlTriggerOrder = buildMarketTriggerOrder({
        assetId,
        side,
        triggerPrice,
        type: triggerOrder.type,
        size: orderSize,
      });
      orders.push(hlTriggerOrder);
    }

    console.log('orders', JSON.stringify(orders, null, 2));
    return await this.exchangeClient.order({
      orders,
      // You might think that grouping: positionTpsl would be for submitting a trigger order with the base order, but it is not, that will result in an error
      grouping: 'na',
      // TODO (kane): blocked, account needs to be created
      // builder: RAINBOW_BUILDER_SETTINGS,
    });
  }

  // TODO (kane): refactor to use available size and same formatting + slippage as the open position
  // test if when closing position from API without the orders to cancel if they get auto cancelled
  async closeIsolatedMarginPosition({
    assetId,
    symbol,
    price,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
    clientOrderId,
  }: {
    assetId: number;
    symbol: string;
    price: string;
    slippageBips?: number;
    clientOrderId?: Hex;
  }): Promise<void> {
    // const account = await this.accountClient.getPerpAccount();
    // const position = account.positions[symbol];
    // if (!position) {
    //   throw new RainbowError('[HyperliquidExchangeClient] No open position found', { symbol });
    // }
    // const orderIdsToCancel: { a: number; o: number }[] = [];
    // if (position.stopLoss?.orders) {
    //   for (const order of position.stopLoss.orders) {
    //     if (order.oid) {
    //       orderIdsToCancel.push({ a: assetId, o: order.oid });
    //     }
    //   }
    // }
    // if (position.takeProfit?.orders) {
    //   for (const order of position.takeProfit.orders) {
    //     if (order.oid) {
    //       orderIdsToCancel.push({ a: assetId, o: order.oid });
    //     }
    //   }
    // }
    // if (orderIdsToCancel.length > 0) {
    //   await this.exchangeClient.cancel({ cancels: orderIdsToCancel });
    // }
    // const nativeInfoClient = new hl.InfoClient({
    //   transport: new hl.HttpTransport(),
    // });
    // const perpState = await nativeInfoClient.clearinghouseState({
    //   user: this.userAddress,
    // });
    // const assetPosition = perpState.assetPositions.find(ap => ap.position.coin === symbol);
    // if (!assetPosition) {
    //   throw new RainbowError('[HyperliquidExchangeClient] Position data not found', { symbol });
    // }
    // const positionSize = Math.abs(parseFloat(assetPosition.position.szi)).toString();
    // const closeOrder = createMarketOrder({
    //   assetId,
    //   side: getOppositePositionSide(position.side),
    //   size: positionSize,
    //   price,
    //   slippageBips,
    //   reduceOnly: true,
    //   clientOrderId,
    // });
    // await this.exchangeClient.order({
    //   orders: [closeOrder],
    //   grouping: 'na',
    //   // TODO (kane): blocked, account needs to be created
    //   // builder: RAINBOW_BUILDER_SETTINGS,
    // });
  }
}
