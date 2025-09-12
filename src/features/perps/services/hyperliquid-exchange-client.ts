import { multiply } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { CancelSuccessResponse, OrderParams } from '@nktkas/hyperliquid/script/src/types/mod';
import { Address, Hex } from 'viem';
import { DEFAULT_SLIPPAGE_BIPS, RAINBOW_BUILDER_SETTINGS } from '../constants';
import { PerpPositionSide, TriggerOrder } from '../types';
import { HyperliquidAccountClient } from './hyperliquid-account-client';
import { Wallet } from '@ethersproject/wallet';
import { isPositive, toFixedWorklet } from '@/safe-math/SafeMath';
import { formatOrderPrice } from '@/features/perps/utils/formatOrderPrice';
import {
  buildMarketOrder,
  buildMarketTriggerOrder,
  calculatePositionSizeFromMarginAmount,
  getMarketType,
} from '@/features/perps/utils/orders';
import { getOppositePositionSide } from '@/features/perps/utils';

type OrderStatusResponse = hl.OrderSuccessResponse['response']['data']['statuses'][number];

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

    return await this.exchangeClient.order({
      orders,
      // You might think that grouping: positionTpsl would be for submitting a trigger order with the base order, but it is not, that will result in an error
      grouping: 'na',
      // TODO BLOCKED (kane): Account needs to be created
      // builder: RAINBOW_BUILDER_SETTINGS,
    });
  }

  async closeIsolatedMarginPosition({
    assetId,
    price,
    sizeDecimals,
    size,
    slippageBips = DEFAULT_SLIPPAGE_BIPS,
  }: {
    assetId: number;
    price: string;
    size: string;
    sizeDecimals: number;
    slippageBips?: number;
  }): Promise<OrderStatusResponse> {
    const side = isPositive(size) ? PerpPositionSide.LONG : PerpPositionSide.SHORT;
    const absoluteSize = Math.abs(Number(size)).toString();
    const closeOrder = buildMarketOrder({
      assetId,
      side: getOppositePositionSide(side),
      size: absoluteSize,
      price,
      sizeDecimals,
      slippageBips,
      reduceOnly: true,
    });

    const result = await this.exchangeClient.order({
      orders: [closeOrder],
      grouping: 'na',
      // TODO BLOCKED (kane): Account needs to be created
      // builder: RAINBOW_BUILDER_SETTINGS,
    });

    return result.response.data.statuses[0];
  }

  async cancelOrder({ assetId, orderId }: { assetId: number; orderId: number }): Promise<CancelSuccessResponse> {
    return await this.exchangeClient.cancel({
      cancels: [{ a: assetId, o: orderId }],
    });
  }
}
