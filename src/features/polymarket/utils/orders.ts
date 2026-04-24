import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import { getPolymarketClobClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketPosition } from '@/features/polymarket/types';
import { wrapUsdcBalanceToPusd } from '@/features/polymarket/utils/collateral';
import { ensureTradingApprovals } from '@/features/polymarket/utils/proxyWallet';
import { RainbowError } from '@/logger';

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

async function refreshBalanceAllowanceForOrder({
  client,
  side,
  tokenId,
}: {
  client: Awaited<ReturnType<typeof getPolymarketClobClient>>;
  side: Side;
  tokenId: string;
}): Promise<void> {
  const params =
    side === Side.BUY ? { asset_type: AssetType.COLLATERAL as const } : { asset_type: AssetType.CONDITIONAL as const, token_id: tokenId };

  await client.updateBalanceAllowance(params);
}

export async function marketBuyToken({
  tokenId,
  amount,
  price,
  negRisk,
}: {
  amount: string | number;
  negRisk: boolean;
  price: string | number;
  tokenId: string;
}): Promise<SuccessfulOrderResult> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[marketBuyToken] No Polymarket proxy address available');
  }

  const client = await getPolymarketClobClient();
  await ensureTradingApprovals(proxyAddress);
  await wrapUsdcBalanceToPusd(proxyAddress);
  await refreshBalanceAllowanceForOrder({ client, side: Side.BUY, tokenId });
  const spendCap = typeof amount === 'number' ? amount : Number(amount);
  const userBalance = Number(usePolymarketBalanceStore.getState().getBalance());

  const order = await client.createMarketOrder(
    {
      side: Side.BUY,
      tokenID: tokenId,
      amount: spendCap,
      price: typeof price === 'number' ? price : Number(price),
      userUSDCBalance: Math.min(userBalance, spendCap),
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
  await refreshBalanceAllowanceForOrder({ client, side: Side.SELL, tokenId });
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
