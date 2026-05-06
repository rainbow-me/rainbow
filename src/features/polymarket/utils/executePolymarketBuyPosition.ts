import { AssetType, OrderType, Side, type ClobClient } from '@polymarket/clob-client-v2';
import { type Address } from 'viem';

import { POLYMARKET_BUILDER_CODE } from '@/features/polymarket/constants';
import { PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { type PolymarketOrderResult, type SuccessfulOrderResult } from '@/features/polymarket/types';
import { getPolygonUsdcBalance, wrapUsdcAmountToPusd } from '@/features/polymarket/utils/collateral';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { ensureTradingApprovals } from '@/features/polymarket/utils/tradingApprovals';
import { RainbowError } from '@/logger';

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

async function convertPolymarketCollateralIfNeeded(proxyAddress: Address): Promise<void> {
  const usdcBalance = await getPolygonUsdcBalance(proxyAddress);
  if (usdcBalance.isZero()) return;

  await wrapUsdcAmountToPusd({ proxyAddress, amount: usdcBalance });
}

async function placePolymarketMarketBuyOrder({
  client,
  tokenId,
  amount,
  price,
  negRisk,
}: MarketBuyOrderParams & { client: ClobClient }): Promise<SuccessfulOrderResult> {
  const spendCap = typeof amount === 'number' ? amount : Number(amount);
  const userBalance = Number(usePolymarketBalanceStore.getState().getBalance());

  const result: PolymarketOrderResult = await client.createAndPostMarketOrder(
    {
      side: Side.BUY,
      tokenID: tokenId,
      amount: spendCap,
      price: typeof price === 'number' ? price : Number(price),
      userUSDCBalance: Math.min(userBalance, spendCap),
      builderCode: POLYMARKET_BUILDER_CODE,
    },
    { negRisk },
    OrderType.FOK
  );

  if ('error' in result || !result.success || result.errorMsg) {
    throw new RainbowError('error' in result ? result.error : result.errorMsg || 'Order was not successful');
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
  onStep?.('preparing');

  const { address: proxyAddress } = await getPolymarketWallet();
  const client = await getPolymarketClobClient();

  try {
    await ensureTradingApprovals();
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
