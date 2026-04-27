import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import { getPolymarketClobClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { ensureTradingApprovals } from '@/features/polymarket/utils/proxyWallet';
import { RainbowError } from '@/logger';

type ErrorOrderResult = {
  error: string;
  status: number;
};

type OrderResult = SuccessfulOrderResult | ErrorOrderResult;
type PolymarketClobClient = Awaited<ReturnType<typeof getPolymarketClobClient>>;

async function refreshSellOrderBalanceAllowance({ client, tokenId }: { client: PolymarketClobClient; tokenId: string }): Promise<void> {
  await client.updateBalanceAllowance({ asset_type: AssetType.CONDITIONAL, token_id: tokenId });
}

export function marketSellTotalPosition({
  position,
  price,
}: {
  position: PolymarketPosition;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  return marketSellToken({ tokenId: position.asset, amount: position.size, price, negRisk: position.negativeRisk });
}

async function marketSellToken({
  tokenId,
  amount,
  price,
  negRisk,
}: {
  tokenId: string;
  amount: string | number;
  negRisk: boolean;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[marketSellToken] No Polymarket proxy address available');
  }

  const client = await getPolymarketClobClient();
  await ensureTradingApprovals(proxyAddress);
  await refreshSellOrderBalanceAllowance({ client, tokenId });
  const order = await client.createMarketOrder(
    {
      side: Side.SELL,
      tokenID: tokenId,
      amount: Number(amount),
      price: Number(price),
      builderCode: POLYMARKET_BUILDER_CODE,
    },
    { negRisk }
  );

  const result = (await client.postOrder(order, OrderType.FOK)) as OrderResult;

  if ('error' in result || ('errorMsg' in result && result.errorMsg !== '')) {
    const error = 'error' in result ? result.error : result.errorMsg;
    throw new RainbowError(error);
  }

  return result;
}
