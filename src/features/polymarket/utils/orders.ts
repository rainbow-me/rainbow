import { getPolymarketClobClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { PolymarketPosition } from '@/features/polymarket/types';
import { ensureTradingApprovals } from '@/features/polymarket/utils/proxyWallet';
import { RainbowError } from '@/logger';
import { OrderType, Side } from '@polymarket/clob-client';

export type SuccessfulOrderResult = {
  errorMsg: string;
  orderID: string;
  takingAmount: string;
  makingAmount: string;
  status: string;
  transactionsHashes: string[];
  success: boolean;
};

type ErrorOrderResult = {
  error: string;
  status: number;
};

type OrderResult = SuccessfulOrderResult | ErrorOrderResult;

export async function marketBuyToken({
  tokenId,
  amount,
  price,
}: {
  amount: string | number;
  price: string | number;
  tokenId: string;
}): Promise<SuccessfulOrderResult> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[marketBuyToken] No Polymarket proxy address available');
  }

  await ensureTradingApprovals(proxyAddress);
  const client = await getPolymarketClobClient();

  const order = await client.createMarketOrder({
    side: Side.BUY,
    tokenID: tokenId,
    amount: typeof amount === 'number' ? amount : Number(amount),
    price: typeof price === 'number' ? price : Number(price),
  });

  const result = await client.postOrder(order, OrderType.FOK);
  if ('error' in result || ('errorMsg' in result && result.errorMsg !== '')) {
    const error = 'error' in result ? result.error : result.errorMsg;
    throw new RainbowError(error);
  }

  return result;
}

export function marketSellTotalPosition({
  position,
  price,
}: {
  position: PolymarketPosition;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  return marketSellToken({ tokenId: position.asset, amount: position.size, price });
}

async function marketSellToken({
  tokenId,
  amount,
  price,
}: {
  tokenId: string;
  amount: string | number;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  const client = await getPolymarketClobClient();
  const order = await client.createMarketOrder(
    {
      side: Side.SELL,
      tokenID: tokenId,
      amount: Number(amount),
      price: Number(price),
    }
    // {
    //   /**
    //    * TODO: Docs imply these options are required, but the types are optional
    //    */
    //   tickSize: String(position.market.orderPriceMinTickSize) as TickSize,
    //   negRisk: position.negativeRisk,
    // }
  );

  return await client.postOrder(order, OrderType.FOK);
}
