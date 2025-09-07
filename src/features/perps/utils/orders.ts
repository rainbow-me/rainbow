import { DEFAULT_SLIPPAGE_BIPS } from '@/features/perps/constants';
import { PerpPositionSide, TriggerOrderType } from '@/features/perps/types';
import { formatOrderPrice } from '@/features/perps/utils/formatOrderPrice';
import { divide, multiply } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { Hex, OrderParams, TIF } from '@nktkas/hyperliquid/script/src/types/mod';

export function getMarketType(assetId: number): 'perp' | 'spot' {
  return assetId < 10_000 ? 'perp' : 'spot';
}

export function calculatePositionSizeFromMarginAmount({
  assetId,
  marginAmount,
  leverage,
  price,
  sizeDecimals,
}: {
  assetId: number;
  marginAmount: string;
  leverage: number;
  price: string;
  sizeDecimals: number;
}): string {
  const marketType = getMarketType(assetId);
  const formattedPrice = formatOrderPrice({ price, sizeDecimals, marketType });
  // Calculate position value from margin amount and leverage
  const positionValue = multiply(marginAmount, leverage);
  // The size is calculated from the price we expect to execute at
  return toFixedWorklet(divide(positionValue, formattedPrice), sizeDecimals);
}

function calculatePriceWithSlippage({
  price,
  side,
  slippageBips,
}: {
  price: string;
  side: PerpPositionSide;
  slippageBips: number;
}): string {
  const slippage = slippageBips / 10_000;
  const slippageMultiplier = 1 + slippage;
  return side === PerpPositionSide.LONG ? multiply(price, slippageMultiplier) : divide(price, slippageMultiplier);
}

export function buildMarketTriggerOrder({
  assetId,
  side,
  triggerPrice,
  type,
  size,
}: {
  assetId: number;
  side: PerpPositionSide;
  triggerPrice: string;
  type: TriggerOrderType;
  size: string;
}): OrderParams {
  return {
    a: assetId,
    b: side !== PerpPositionSide.LONG,
    p: triggerPrice,
    s: size,
    r: true,
    t: { trigger: { isMarket: true, triggerPx: triggerPrice, tpsl: type } },
  };
}

export function buildMarketOrder({
  assetId,
  side,
  size,
  price,
  sizeDecimals,
  slippageBips = DEFAULT_SLIPPAGE_BIPS,
  reduceOnly = false,
  tif = 'FrontendMarket',
  clientOrderId,
}: {
  assetId: number;
  side: PerpPositionSide;
  size: string;
  price: string;
  sizeDecimals: number;
  slippageBips?: number;
  reduceOnly?: boolean;
  tif?: TIF;
  clientOrderId?: Hex;
}): OrderParams {
  const marketType = getMarketType(assetId);
  const priceWithSlippage = calculatePriceWithSlippage({ price, side, slippageBips });
  const formattedPriceWithSlippage = formatOrderPrice({ price: priceWithSlippage, sizeDecimals, marketType });

  return {
    a: assetId,
    b: side === PerpPositionSide.LONG,
    p: formattedPriceWithSlippage,
    s: size,
    r: reduceOnly,
    t: { limit: { tif } },
    c: clientOrderId,
  };
}
