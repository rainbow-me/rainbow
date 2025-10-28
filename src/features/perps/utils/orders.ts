import { DEFAULT_SLIPPAGE_BIPS, SPOT_ASSET_ID_OFFSET } from '@/features/perps/constants';
import { OrderParams, PerpPositionSide, TriggerOrderType, TIF } from '@/features/perps/types';
import { formatOrderPrice } from '@/features/perps/utils/formatOrderPrice';
import { divide, multiply } from '@/helpers/utilities';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';

export function getMarketType(assetId: number): 'perp' | 'spot' {
  return assetId < SPOT_ASSET_ID_OFFSET ? 'perp' : 'spot';
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
  const positionValue = multiply(marginAmount, leverage);
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
}: {
  assetId: number;
  side: PerpPositionSide;
  size: string;
  price: string;
  sizeDecimals: number;
  slippageBips?: number;
  reduceOnly?: boolean;
  tif?: TIF;
}): OrderParams {
  const marketType = getMarketType(assetId);
  const priceWithSlippage = calculatePriceWithSlippage({ price, side, slippageBips });
  const formattedPriceWithSlippage = formatOrderPrice({ price: priceWithSlippage, sizeDecimals, marketType });
  const formattedSize = toFixedWorklet(size, sizeDecimals);

  return {
    a: assetId,
    b: side === PerpPositionSide.LONG,
    p: formattedPriceWithSlippage,
    s: formattedSize,
    r: reduceOnly,
    t: { limit: { tif } },
  };
}

export function calculatePositionSize({
  marginAmount,
  entryPrice,
  leverage,
}: {
  marginAmount: string;
  entryPrice: string;
  leverage: number;
}) {
  'worklet';
  return divWorklet(mulWorklet(marginAmount, leverage), entryPrice);
}
