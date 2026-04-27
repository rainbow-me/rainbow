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

export async function marketSellTotalPosition({
  position,
  price,
}: {
  position: PolymarketPosition;
  price: string | number;
}): Promise<SuccessfulOrderResult> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[marketSellTotalPosition] No Polymarket proxy address available');
  }

  const client = await getPolymarketClobClient();
  await ensureTradingApprovals(proxyAddress);
  await client.updateBalanceAllowance({ asset_type: AssetType.CONDITIONAL, token_id: position.asset });

  const order = await client.createMarketOrder(
    {
      side: Side.SELL,
      tokenID: position.asset,
      amount: Number(position.size),
      price: Number(price),
      builderCode: POLYMARKET_BUILDER_CODE,
    },
    { negRisk: position.negativeRisk }
  );

  const result = (await client.postOrder(order, OrderType.FOK)) as OrderResult;

  if ('error' in result || ('errorMsg' in result && result.errorMsg !== '')) {
    const error = 'error' in result ? result.error : result.errorMsg;
    throw new RainbowError(error);
  }

  return result;
}
