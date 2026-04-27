import { AssetType, OrderType, Side } from '@polymarket/clob-client-v2';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketClobClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type SuccessfulOrderResult } from '@/features/polymarket/types';
import { getPolymarketUsdcBalance, wrapUsdcAmountToPusd } from '@/features/polymarket/utils/collateral';
import { ensureTradingApprovals } from '@/features/polymarket/utils/proxyWallet';
import { RainbowError } from '@/logger';

type ErrorOrderResult = {
  error: string;
  status: number;
};

type OrderResult = SuccessfulOrderResult | ErrorOrderResult;
type PolymarketClobClient = Awaited<ReturnType<typeof getPolymarketClobClient>>;

export type PolymarketBuyPositionStep = 'preparing' | 'placing_order' | 'confirming_order';

type MarketBuyOrderParams = {
  amount: string | number;
  negRisk: boolean;
  price: string | number;
  tokenId: string;
};

type ExecutePolymarketBuyPositionParams = MarketBuyOrderParams & {
  onStep?: (step: PolymarketBuyPositionStep) => void;
};

async function convertPolymarketCollateralIfNeeded(proxyAddress: string): Promise<boolean> {
  const usdcBalance = await getPolymarketUsdcBalance(proxyAddress);
  if (usdcBalance.isZero()) return false;

  await wrapUsdcAmountToPusd({ proxyAddress, amount: usdcBalance });
  return true;
}

async function placePolymarketMarketBuyOrder({
  client,
  tokenId,
  amount,
  price,
  negRisk,
}: MarketBuyOrderParams & { client: PolymarketClobClient }): Promise<SuccessfulOrderResult> {
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

export async function executePolymarketBuyPosition({
  tokenId,
  amount,
  price,
  negRisk,
  onStep,
}: ExecutePolymarketBuyPositionParams): Promise<SuccessfulOrderResult> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[executePolymarketBuyPosition] No Polymarket proxy address available');
  }

  onStep?.('preparing');

  const client = await getPolymarketClobClient();

  try {
    await ensureTradingApprovals(proxyAddress);
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'trading_approval_failed');
  }

  try {
    await convertPolymarketCollateralIfNeeded(proxyAddress);
  } catch (error) {
    throw new PolymarketBuyPositionError(error, 'collateral_conversion_failed');
  }

  onStep?.('placing_order');

  await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL });
  return await placePolymarketMarketBuyOrder({ client, tokenId, amount, price, negRisk });
}
