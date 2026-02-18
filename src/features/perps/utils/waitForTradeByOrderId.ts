import { type HlTrade } from '../types';
import { hlTradesStoreActions } from '../stores/hlTradesStore';
import { getHyperliquidAccountClient } from '../services';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = time.ms(500);

export async function waitForTradeByOrderId({
  symbol,
  orderId,
  attempts = DEFAULT_ATTEMPTS,
  delayMs = DEFAULT_DELAY_MS,
}: {
  symbol: string;
  orderId?: number;
  attempts?: number;
  delayMs?: number;
}): Promise<HlTrade | null> {
  if (orderId === undefined) return null;

  const initialTrade = hlTradesStoreActions.getTradeByOrderId({ symbol, orderId });
  if (initialTrade) return initialTrade;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const orderFilled = await isOrderFilled(orderId);
    if (orderFilled) {
      return await fetchTradeByOrderId({ symbol, orderId });
    }

    if (attempt < attempts - 1) await delay(delayMs);
  }

  return null;
}

async function fetchTradeByOrderId({
  symbol,
  orderId,
  attempts = DEFAULT_ATTEMPTS,
  delayMs = DEFAULT_DELAY_MS,
}: {
  symbol: string;
  orderId: number;
  attempts?: number;
  delayMs?: number;
}): Promise<HlTrade | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    await hlTradesStoreActions.fetch(undefined, { force: true });
    const trade = hlTradesStoreActions.getTradeByOrderId({ symbol, orderId });
    if (trade) return trade;

    if (attempt < attempts - 1) await delay(delayMs);
  }

  return null;
}

async function isOrderFilled(orderId: number): Promise<boolean> {
  try {
    return await getHyperliquidAccountClient().isOrderFilled(orderId);
  } catch {
    return false;
  }
}
