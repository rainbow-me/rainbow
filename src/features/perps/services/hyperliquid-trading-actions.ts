import { RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { OrderResponse } from '@nktkas/hyperliquid';
import { PerpPositionSide, TriggerOrder } from '../types';
import { refetchHyperliquidStores } from '../utils';
import { hlOpenOrdersStoreActions } from '../stores/hlOpenOrdersStore';
import { useHyperliquidMarketsStore } from '../stores/hyperliquidMarketsStore';
import { getHyperliquidExchangeClient } from './index';

export async function withdraw(amount: string): Promise<void> {
  const address = useWalletsStore.getState().accountAddress;
  const exchangeClient = await getHyperliquidExchangeClient(address);
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
}): Promise<OrderResponse> {
  const address = useWalletsStore.getState().accountAddress;
  const exchangeClient = await getHyperliquidExchangeClient(address);
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
  await exchangeClient.cancelOrder({ assetId: market.id, orderId });
  await hlOpenOrdersStoreActions.fetch(undefined, { force: true });
}
