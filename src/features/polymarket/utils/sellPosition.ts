import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { type PolymarketOrderResult, type PolymarketPosition, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { ensureTradingApprovals } from '@/features/polymarket/utils/proxyWallet';
import { RainbowError } from '@/logger';

export async function marketSellTotalPosition({
  position,
  price,
}: {
  position: PolymarketPosition;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  const client = await getPolymarketClobClient();
  await ensureTradingApprovals();
  await client.updateBalanceAllowance({ asset_type: AssetType.CONDITIONAL, token_id: position.asset });

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.SELL,
      tokenID: position.asset,
      amount: Number(position.size),
      price: Number(price),
      builderCode: POLYMARKET_BUILDER_CODE,
    },
    { negRisk: position.negativeRisk },
    OrderType.FOK
  );

  if ('error' in result || !result.success || result.errorMsg) {
    throw new RainbowError('error' in result ? result.error : result.errorMsg || 'Order was not successful');
  }

  return result;
}
