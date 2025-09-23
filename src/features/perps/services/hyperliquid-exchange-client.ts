import { multiply } from '@/helpers/utilities';
import * as hl from '@nktkas/hyperliquid';
import { CancelSuccessResponse, OrderParams } from '@nktkas/hyperliquid/script/src/types/mod';
import { Address, Hex } from 'viem';
import { DEFAULT_SLIPPAGE_BIPS, RAINBOW_BUILDER_SETTINGS } from '../constants';
import { PerpPositionSide, TriggerOrder, TriggerOrderType } from '../types';
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
import { getProvider } from '@/handlers/web3';
import { ChainId } from '@/state/backendNetworks/types';
import { loadWallet } from '@/model/wallet';

type OrderStatusResponse = hl.OrderSuccessResponse['response']['data']['statuses'][number];

export class HyperliquidExchangeClient {
  private accountClient: HyperliquidAccountClient;
  private exchangeClient: Promise<hl.ExchangeClient> | undefined;
  private userAddress: Address;

  constructor(accountClient: HyperliquidAccountClient, userAddress: Address) {
    this.accountClient = accountClient;
    this.userAddress = userAddress;
  }

  private async getExchangeClient(): Promise<hl.ExchangeClient> {
    if (!this.exchangeClient) {
      this.exchangeClient = (async () => {
        const wallet = await loadWallet({
          address: this.userAddress,
          provider: getProvider({ chainId: ChainId.arbitrum }),
          showErrorIfNotLoaded: false,
        });

        if (!wallet) throw new Error('[HyperliquidExchangeClient] Failed to load wallet for signing');
        // const localWallet: Wallet | undefined = '_isSigner' in wallet ? undefined : wallet;

        return new hl.ExchangeClient({
          transport: new hl.HttpTransport(),
          // wallet: localWallet ?? (wallet as Wallet),
          wallet: wallet as Wallet,
        });
      })();
    }

    const client = await this.exchangeClient;
    return client;
  }

  async withdraw(amount: string): Promise<void> {
    await (
      await this.getExchangeClient()
    ).withdraw3({
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
    await Promise.all([
      // TODO (kane): technically we should not call this if the leverage is already set to the desired value
      (await this.getExchangeClient()).updateLeverage({
        asset: assetId,
        isCross: false,
        leverage,
      }),
      this.ensureApprovedBuilderFee(),
    ]);

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

    return await (
      await this.getExchangeClient()
    ).order({
      orders,
      // You might think that grouping: positionTpsl would be for submitting a trigger order with the base order, but it is not, that will result in an error
      grouping: 'na',
      builder: RAINBOW_BUILDER_SETTINGS,
    });
  }

  async createTriggerOrder({
    assetId,
    side,
    triggerPrice,
    type,
    orderFraction,
    positionSize,
    sizeDecimals,
  }: {
    assetId: number;
    side: PerpPositionSide;
    triggerPrice: string;
    type: TriggerOrderType;
    orderFraction: string;
    positionSize: string;
    sizeDecimals: number;
  }): Promise<hl.OrderSuccessResponse> {
    await this.ensureApprovedBuilderFee();

    const marketType = getMarketType(assetId);
    const formattedTriggerPrice = formatOrderPrice({ price: triggerPrice, sizeDecimals, marketType });
    const formattedPositionSize = toFixedWorklet(positionSize, sizeDecimals);
    const orderSize = orderFraction === '1' ? '0' : toFixedWorklet(multiply(formattedPositionSize, orderFraction), sizeDecimals);

    const triggerOrder = buildMarketTriggerOrder({
      assetId,
      side,
      triggerPrice: formattedTriggerPrice,
      type,
      size: orderSize,
    });

    return await (
      await this.getExchangeClient()
    ).order({
      orders: [triggerOrder],
      grouping: 'na',
      builder: RAINBOW_BUILDER_SETTINGS,
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

    await this.ensureApprovedBuilderFee();

    const result = await (
      await this.getExchangeClient()
    ).order({
      orders: [closeOrder],
      grouping: 'na',
      builder: RAINBOW_BUILDER_SETTINGS,
    });

    return result.response.data.statuses[0];
  }

  async cancelOrder({ assetId, orderId }: { assetId: number; orderId: number }): Promise<CancelSuccessResponse> {
    return await (
      await this.getExchangeClient()
    ).cancel({
      cancels: [{ a: assetId, o: orderId }],
    });
  }

  async ensureApprovedBuilderFee(): Promise<hl.SuccessResponse | void> {
    const isApproved = await this.accountClient.isBuilderFeeApproved();
    if (isApproved) return;

    return await (
      await this.getExchangeClient()
    ).approveBuilderFee({
      builder: RAINBOW_BUILDER_SETTINGS.b,
      maxFeeRate: toMaxFeeRate(RAINBOW_BUILDER_SETTINGS.f),
    });
  }
}

/**
 * Converts the builder fee from tenths of a basis point to a percentage string.
 */
function toMaxFeeRate(feeInTenthsOfBips: number): `${string}%` {
  return `${feeInTenthsOfBips * 0.001}%`;
}
