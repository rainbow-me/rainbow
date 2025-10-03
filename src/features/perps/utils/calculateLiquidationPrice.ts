import { PerpMarket, PerpPositionSide } from '@/features/perps/types';
import { getApplicableMaxLeverage } from '@/features/perps/utils/getApplicableMaxLeverage';
import {
  divWorklet,
  mulWorklet,
  subWorklet,
  sumWorklet,
  greaterThanWorklet,
  lessThanOrEqualToWorklet,
  equalWorklet,
} from '@/safe-math/SafeMath';

// Implemented from reference implementation: https://github.com/hyperliquid-dex/ts-examples/blob/main/examples/LiquidationPx.tsx

function calculatePositionSize({
  marginAmount,
  entryPrice,
  leverage,
}: {
  marginAmount: string;
  entryPrice: string;
  leverage: string | number;
}): string {
  'worklet';
  const notionalValue = mulWorklet(marginAmount, leverage);
  return divWorklet(notionalValue, entryPrice);
}

/**
 * Calculate the estimated liquidation price for an isolated margin position.
 *
 * @param entryPrice - The entry/mark price for the position
 * @param positionSize - The size of the position in units
 * @param orderSide - Whether the ORDER is LONG or SHORT
 * @param positionSide - Whether the final POSITION is LONG or SHORT
 * @param maxLeverage - The maximum leverage allowed for this asset
 * @param rawUsd - The isolated margin amount (raw USD allocated to position)
 */
export function calculateIsolatedLiquidationPrice({
  entryPrice,
  positionSize,
  orderSide,
  positionSide,
  maxLeverage,
  rawUsd,
}: {
  entryPrice: string;
  positionSize: string;
  orderSide: PerpPositionSide;
  positionSide: PerpPositionSide;
  maxLeverage: string | number;
  rawUsd: string;
}): string | null {
  'worklet';
  if (equalWorklet(rawUsd, '0')) return null;

  const isOrderLong = orderSide === PerpPositionSide.LONG;
  const orderFloatSide = isOrderLong ? '1' : '-1';

  const isPositionLong = positionSide === PerpPositionSide.LONG;
  const positionFloatSide = isPositionLong ? '1' : '-1';

  const maxLeverageStr = typeof maxLeverage === 'number' ? maxLeverage.toString() : maxLeverage;

  const signedPositionSize = mulWorklet(positionFloatSide, positionSize);
  const notional = mulWorklet(signedPositionSize, entryPrice);
  const accountValue = sumWorklet(notional, rawUsd);
  const totalNotionalPosition = mulWorklet(positionSize, entryPrice);
  const maintenanceLeverage = mulWorklet(maxLeverageStr, '2');

  // Calculate correction factor: 1 - orderFloatSide / maintenanceLeverage
  const orderSideDivMaintenanceLeverage = divWorklet(orderFloatSide, maintenanceLeverage);
  const correction = subWorklet('1', orderSideDivMaintenanceLeverage);

  // entryPrice - (positionFloatSide * (accountValue - totalNotionalPosition / maintenanceLeverage)) / positionSize / correction
  const totalNotionalDivMaintenanceLeverage = divWorklet(totalNotionalPosition, maintenanceLeverage);
  const accountValueMinusTerm = subWorklet(accountValue, totalNotionalDivMaintenanceLeverage);
  const positionSideTimesAccountValue = mulWorklet(positionFloatSide, accountValueMinusTerm);
  const dividedByPositionSize = divWorklet(positionSideTimesAccountValue, positionSize);
  const dividedByCorrection = divWorklet(dividedByPositionSize, correction);
  const liquidationPrice = subWorklet(entryPrice, dividedByCorrection);

  if (lessThanOrEqualToWorklet(liquidationPrice, '0') || greaterThanWorklet(liquidationPrice, '1e15') || equalWorklet(positionSize, '0')) {
    return null;
  }

  return liquidationPrice;
}

export function calculateIsolatedLiquidationPriceFromMargin({
  entryPrice,
  marginAmount,
  positionSide,
  leverage,
  market,
}: {
  entryPrice: string;
  marginAmount: string;
  positionSide: PerpPositionSide;
  leverage: number;
  market: PerpMarket;
}): string {
  'worklet';

  const maxLeverage = getApplicableMaxLeverage({
    market,
    amount: marginAmount,
    price: entryPrice,
    leverage: leverage,
  });

  const positionSize = calculatePositionSize({
    marginAmount,
    entryPrice,
    leverage,
  });

  const isLong = positionSide === PerpPositionSide.LONG;
  const floatSide = isLong ? '1' : '-1';
  const signedPositionSize = mulWorklet(floatSide, positionSize);
  const positionCost = mulWorklet(entryPrice, signedPositionSize);
  const rawUsd = subWorklet(marginAmount, positionCost);

  // For a new position, order side and position side are the same
  const liquidationPrice = calculateIsolatedLiquidationPrice({
    entryPrice,
    positionSize,
    orderSide: positionSide,
    positionSide,
    maxLeverage,
    rawUsd,
  });

  return liquidationPrice ? liquidationPrice : '0';
}
