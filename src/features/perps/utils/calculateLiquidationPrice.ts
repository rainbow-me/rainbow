import { PerpPositionSide } from '@/features/perps/types';

// TODO (kane): refactor to more comprehensive formula defined here: https://github.com/hyperliquid-dex/ts-examples/blob/main/examples/LiquidationPx.tsx

/**
 * Calculate the estimated liquidation price for an isolated margin position.
 *
 * Based on Hyperliquid's documentation:
 * - Initial margin = position value / leverage
 * - Maintenance margin rate = (1 / maxLeverage) / 2
 * - Maintenance margin = position value * maintenance margin rate
 * - Liquidation occurs when: margin_available < maintenance_margin_required
 *
 * Formula from docs: liq_price = price - side * margin_available / position_size / (1 - l * side)
 * where l = 1 / MAINTENANCE_LEVERAGE
 */
export function calculateIsolatedLiquidationPrice({
  entryPrice,
  marginAmount,
  positionSide,
  leverage,
  maxLeverage,
}: {
  entryPrice: number;
  marginAmount: number;
  positionSide: PerpPositionSide;
  leverage: number;
  maxLeverage: number;
}) {
  'worklet';

  const isLong = positionSide === PerpPositionSide.LONG;
  const side = isLong ? 1 : -1;

  const positionValue = marginAmount * entryPrice;
  const isolatedMargin = positionValue / leverage;

  const maintenanceMarginRate = 1 / maxLeverage / 2;
  const maintenanceMarginRequired = positionValue * maintenanceMarginRate;

  const marginAvailable = isolatedMargin - maintenanceMarginRequired;

  const maintenanceLeverage = 2 * maxLeverage;
  const l = 1 / maintenanceLeverage;

  const liquidationPrice = entryPrice - (side * marginAvailable) / marginAmount / (1 - l * side);

  return Math.max(0, liquidationPrice);
}
