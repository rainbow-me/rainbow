import { time } from '@/framework/core/utils/time';
import { delay } from '@/utils/delay';

import { getHyperliquidAccountClient } from '../services';
import { hlTradesStoreActions } from '../stores/hlTradesStore';
import { type HlTrade } from '../types';

const DEFAULT_TIMEOUT_MS = time.seconds(5);
const POLL_INTERVAL_MS = time.ms(500);

export async function waitForTradeByOrderId({
  symbol,
  orderId,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  symbol: string;
  orderId?: number;
  timeoutMs?: number;
}): Promise<HlTrade | null> {
  if (orderId === undefined) return null;

  const initialTrade = hlTradesStoreActions.getTradeByOrderId({ symbol, orderId });
  if (initialTrade) return initialTrade;

  const deadline = Date.now() + timeoutMs;
  const orderFilled = await pollOrderFilled({ orderId, deadline });
  if (orderFilled) return await pollTradeByOrderId({ symbol, orderId, deadline });
  return null;
}

async function pollOrderFilled({ orderId, deadline }: { orderId: number; deadline: number }): Promise<boolean> {
  while (Date.now() < deadline) {
    const orderFilled = await getHyperliquidAccountClient().isOrderFilled(orderId);
    if (orderFilled) return true;
    if (Date.now() + POLL_INTERVAL_MS >= deadline) break;
    await delay(POLL_INTERVAL_MS);
  }
  return false;
}

async function pollTradeByOrderId({
  symbol,
  orderId,
  deadline,
}: {
  symbol: string;
  orderId: number;
  deadline: number;
}): Promise<HlTrade | null> {
  while (Date.now() < deadline) {
    await hlTradesStoreActions.fetch(undefined, { force: true });
    const trade = hlTradesStoreActions.getTradeByOrderId({ symbol, orderId });
    if (trade) return trade;
    if (Date.now() + POLL_INTERVAL_MS >= deadline) break;
    await delay(POLL_INTERVAL_MS);
  }
  return null;
}
