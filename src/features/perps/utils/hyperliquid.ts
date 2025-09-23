import { infoClient } from '@/features/perps/services/hyperliquid-account-client';
import { PerpMarket, PerpPositionSide, TriggerOrder } from '@/features/perps/types';
import { divide, subtract, multiply } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { OrderResponse } from '@nktkas/hyperliquid';
import { refetchHyperliquidStores } from '../utils';
import { hlOpenOrdersStoreActions } from '../stores/hlOpenOrdersStore';
import { useHyperliquidMarketsStore } from '../stores/hyperliquidMarketsStore';
import { useHyperliquidAccountStore } from '../stores/hyperliquidAccountStore';
import { getHyperliquidExchangeClient } from '../services';

export async function getAllMarketsInfo(): Promise<PerpMarket[]> {
  const [meta, assetCtxs] = await infoClient.metaAndAssetCtxs();
  const assetsBasicInfo = meta.universe;
  const assetsPricingInfo = assetCtxs;

  return assetsBasicInfo
    .map((asset, index) => {
      const assetId = index;
      const assetPricingInfo = assetsPricingInfo[index];
      if (!assetPricingInfo || asset.isDelisted) {
        return null;
      }

      const marginTable = meta.marginTables.find(mt => mt[0] === asset.marginTableId)?.[1] ?? null;
      const markPrice = assetPricingInfo.markPx;
      const midPrice = assetPricingInfo.midPx ?? markPrice;
      const price = midPrice ?? markPrice;
      const previousDayPrice = assetPricingInfo.prevDayPx;

      const priceChange24h = divide(subtract(price, previousDayPrice), multiply(previousDayPrice, 100));

      return {
        id: assetId,
        price,
        midPrice,
        priceChange: {
          '1h': '',
          '24h': priceChange24h,
        },
        volume: {
          '24h': assetPricingInfo.dayNtlVlm,
        },
        symbol: asset.name,
        maxLeverage: asset.maxLeverage,
        marginTiers: marginTable?.marginTiers,
        decimals: asset.szDecimals,
        fundingRate: assetPricingInfo.funding,
      };
    })
    .filter(Boolean);
}

export async function withdraw(amount: string): Promise<void> {
  const address = useWalletsStore.getState().accountAddress;
  const exchangeClient = await getHyperliquidExchangeClient(address);
  if (!exchangeClient) return;
  await exchangeClient.withdraw(amount);
}

export async function createIsolatedMarginPosition({
  symbol,
  side,
  leverage,
  marginAmount,
  price,
  triggerOrders,
}: {
  symbol: string;
  side: PerpPositionSide;
  leverage: number;
  marginAmount: string;
  price: string;
  triggerOrders?: TriggerOrder[];
}): Promise<OrderResponse | void> {
  const address = useWalletsStore.getState().accountAddress;
  const exchangeClient = await getHyperliquidExchangeClient(address);
  if (!exchangeClient) return;

  const market = useHyperliquidMarketsStore.getState().markets[symbol];
  if (!market) {
    throw new RainbowError('[HyperliquidTradingActions] Market not found');
  }
  const result = await exchangeClient.openIsolatedMarginPosition({
    assetId: market.id,
    side,
    marginAmount,
    price,
    leverage,
    sizeDecimals: market.decimals,
    triggerOrders,
  });

  await refetchHyperliquidStores();

  return result;
}

export async function closeIsolatedMarginPosition({ symbol, price, size }: { symbol: string; price: string; size: string }): Promise<void> {
  const address = useWalletsStore.getState().accountAddress;
  const market = useHyperliquidMarketsStore.getState().markets[symbol];
  if (!market) {
    throw new RainbowError('[HyperliquidTradingActions] Market not found');
  }
  const exchangeClient = await getHyperliquidExchangeClient(address);
  if (!exchangeClient) return;

  await exchangeClient.closeIsolatedMarginPosition({
    assetId: market.id,
    price,
    sizeDecimals: market.decimals,
    size,
  });
  await refetchHyperliquidStores();
}

export async function cancelOrder({ symbol, orderId }: { symbol: string; orderId: number }): Promise<void> {
  const address = useWalletsStore.getState().accountAddress;
  const market = useHyperliquidMarketsStore.getState().markets[symbol];
  if (!market) {
    throw new RainbowError('[HyperliquidTradingActions] Market not found');
  }
  const exchangeClient = await getHyperliquidExchangeClient(address);
  if (!exchangeClient) return;
  await exchangeClient.cancelOrder({ assetId: market.id, orderId });
  await hlOpenOrdersStoreActions.fetch(undefined, { force: true });
}

export async function createTriggerOrder({ symbol, triggerOrder }: { symbol: string; triggerOrder: TriggerOrder }): Promise<void> {
  const address = useWalletsStore.getState().accountAddress;
  const market = useHyperliquidMarketsStore.getState().markets[symbol];
  if (!market) {
    throw new RainbowError('[HyperliquidTradingActions] Market not found');
  }

  const position = useHyperliquidAccountStore.getState().getPosition(symbol);
  if (!position) {
    throw new RainbowError('[HyperliquidTradingActions] No open position for trigger order');
  }

  const exchangeClient = await getHyperliquidExchangeClient(address);
  if (!exchangeClient) return;

  const positionSize = Math.abs(Number(position.size)).toString();

  await exchangeClient.createTriggerOrder({
    assetId: market.id,
    side: position.side,
    triggerPrice: triggerOrder.price,
    type: triggerOrder.type,
    orderFraction: triggerOrder.orderFraction,
    positionSize,
    sizeDecimals: market.decimals,
  });

  await refetchHyperliquidStores();
}
