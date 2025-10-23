import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PANEL_BACKGROUND_DARK, PANEL_BACKGROUND_LIGHT } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
import { FloatingSparks } from '@/features/perps/screens/perps-trade-details-sheet/FloatingSparks';
import { PerspectiveGrid } from '@/features/perps/screens/perps-trade-details-sheet/PerspectiveGrid';
import { SkiaBadge } from '@/components/SkiaBadge';
import { HlTrade, TradeExecutionType } from '@/features/perps/types';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import useDimensions from '@/hooks/useDimensions';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { divWorklet, mulWorklet, subWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { Blur, Canvas, Group, LinearGradient, Oval, Rect, vec } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import * as i18n from '@/languages';

const CONFIG = {
  layout: {
    horizontalInset: 16,
    topSectionHeight: 225,
    gridHeight: 70,
    gridOverflow: 164,
    outcomeInfoOffset: 32 + 40 + 8,
    ovalTranslateY: 60,
  },
  grid: {
    horizontalLines: 6,
    verticalLines: 10,
    vanishingPointY: -100,
    perspectiveStrength: 1.5,
    opacity: {
      dark: 0.4,
      light: 0.3,
    },
    accentOpacity: 0.08,
  },
  oval: {
    height: 80,
    opacity: 0.1,
    blur: 104 / 2,
    rotation: Math.PI / 4,
  },
};

export const TradeDetailsGraphic = memo(function TradeDetailsGraphic({ trade }: { trade: HlTrade }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const displayType = getDisplayType(trade);
  const isLoss = displayType === 'loss';
  const backgroundColor = isDarkMode ? PANEL_BACKGROUND_DARK : PANEL_BACKGROUND_LIGHT;
  const sheetWidth = width - CONFIG.layout.horizontalInset;
  const graphicHeight = CONFIG.layout.topSectionHeight + CONFIG.layout.gridHeight;
  const gridOverflow = CONFIG.layout.gridOverflow;
  const gridHeight = CONFIG.layout.gridHeight;
  const gridWidth = sheetWidth + gridOverflow;
  const accentColor = getAccentColor(trade);
  const ovalHeight = CONFIG.oval.height;
  const ovalOpacity = CONFIG.oval.opacity;
  const ovalColor = opacityWorklet(accentColor, ovalOpacity);

  return (
    <Box width={sheetWidth} height={graphicHeight}>
      <Canvas style={{ width: sheetWidth, height: graphicHeight }}>
        {isDarkMode && <GradientBackground width={sheetWidth} height={CONFIG.layout.topSectionHeight} color={accentColor} />}
        <FloatingSparks
          height={CONFIG.layout.topSectionHeight}
          width={sheetWidth}
          sparkColor={accentColor}
          direction={isLoss ? 'down' : 'up'}
        />
        {/* Solid background to hide sparks behind the grid */}
        <Rect x={0} y={CONFIG.layout.topSectionHeight} width={sheetWidth} height={gridHeight} color={backgroundColor} />
        <Group transform={[{ translateY: CONFIG.layout.topSectionHeight }, { translateX: -gridOverflow / 2 }]}>
          <Group opacity={isDarkMode ? CONFIG.grid.opacity.dark : CONFIG.grid.opacity.light}>
            <PerspectiveGrid
              lineColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#E0E0E0'}
              horizontalLines={CONFIG.grid.horizontalLines}
              verticalLines={CONFIG.grid.verticalLines}
              width={gridWidth}
              height={gridHeight}
              vanishingPointY={CONFIG.grid.vanishingPointY}
              perspectiveStrength={CONFIG.grid.perspectiveStrength}
            />
          </Group>
          {/* Grid fading gradient */}
          <Rect dither antiAlias x={0} y={0} width={gridWidth} height={gridHeight}>
            <LinearGradient
              colors={[opacityWorklet(backgroundColor, 0), backgroundColor]}
              start={vec(0, gridHeight / 2)}
              end={vec(0, gridHeight)}
            />
          </Rect>
          {/* Grid background accent gradient */}
          {isDarkMode && (
            <Rect dither antiAlias x={0} y={0} width={gridWidth} height={gridHeight} opacity={CONFIG.grid.accentOpacity}>
              <LinearGradient colors={[accentColor, opacityWorklet(accentColor, 0)]} start={vec(0, 0)} end={vec(0, gridHeight)} />
            </Rect>
          )}
        </Group>
        {/* Background accent blur */}
        <Group dither antiAlias transform={[{ translateY: CONFIG.layout.ovalTranslateY }]}>
          <Oval x={0} y={0} width={sheetWidth} height={ovalHeight} color={ovalColor} />
          <Oval
            x={0}
            y={0}
            origin={vec(sheetWidth / 2, ovalHeight / 2)}
            transform={[{ rotate: CONFIG.oval.rotation }]}
            width={sheetWidth}
            height={ovalHeight}
            color={ovalColor}
          />
          <Oval
            x={0}
            y={0}
            origin={vec(sheetWidth / 2, ovalHeight / 2)}
            transform={[{ rotate: -CONFIG.oval.rotation }]}
            width={sheetWidth}
            height={ovalHeight}
            color={ovalColor}
          />
          <Blur blur={CONFIG.oval.blur} />
        </Group>
      </Canvas>
      <Box width="full" position="absolute" top={{ custom: CONFIG.layout.outcomeInfoOffset }}>
        <OutcomeInfo trade={trade} />
      </Box>
    </Box>
  );
});

// The display type determines the color theme of the graphic.
type DisplayType = 'loss' | 'profit' | 'info';

function getDisplayType(trade: HlTrade): DisplayType {
  switch (trade.executionType) {
    case TradeExecutionType.LONG_LIQUIDATED:
    case TradeExecutionType.SHORT_LIQUIDATED:
      return 'loss';
    case TradeExecutionType.LONG_CLOSED:
    case TradeExecutionType.SHORT_CLOSED:
      return Number(trade.pnl) < 0 ? 'loss' : 'profit';
    case TradeExecutionType.LONG_OPENED:
    case TradeExecutionType.SHORT_OPENED:
      return 'info';
    case TradeExecutionType.TAKE_PROFIT_EXECUTED:
      return 'profit';
    case TradeExecutionType.STOP_LOSS_EXECUTED:
      return 'loss';
    default:
      return 'info';
  }
}

function getAccentColor(trade: HlTrade) {
  const displayType = getDisplayType(trade);

  switch (displayType) {
    case 'loss':
      return '#FF584D';
    case 'profit':
      return '#1F9E39';
    case 'info':
      return '#3ECFAD';
  }
}

const GradientBackground = ({ width, height, color }: { width: number; height: number; color: string }) => {
  return (
    <Group>
      <Rect dither antiAlias x={0} y={0} width={width} height={height}>
        <LinearGradient colors={[opacityWorklet(color, 0), opacityWorklet(color, 0.2)]} start={vec(0, 32)} end={vec(0, height)} />
      </Rect>
      <Rect dither antiAlias x={0} y={0} width={width} height={height}>
        <LinearGradient colors={[opacityWorklet(color, 0.03), opacityWorklet(color, 0)]} start={vec(0, 0)} end={vec(0, height - 32)} />
      </Rect>
    </Group>
  );
};

function getTitleText(trade: HlTrade) {
  if (trade.executionType === TradeExecutionType.LONG_LIQUIDATED || trade.executionType === TradeExecutionType.SHORT_LIQUIDATED) {
    return i18n.t(i18n.l.perps.trade_details_sheet.outcome.liquidated);
  }
  if (trade.executionType === TradeExecutionType.LONG_OPENED || trade.executionType === TradeExecutionType.SHORT_OPENED) {
    return i18n.t(i18n.l.perps.trade_details_sheet.outcome.opened);
  }
  if (trade.executionType === TradeExecutionType.LONG_CLOSED || trade.executionType === TradeExecutionType.SHORT_CLOSED) {
    if (Number(trade.pnl) < 0) {
      return i18n.t(i18n.l.perps.trade_details_sheet.outcome.lost);
    }
    return i18n.t(i18n.l.perps.trade_details_sheet.outcome.earned);
  }
  if (trade.executionType === TradeExecutionType.STOP_LOSS_EXECUTED) {
    return i18n.t(i18n.l.perps.trade_details_sheet.outcome.lost);
  }
  if (trade.executionType === TradeExecutionType.TAKE_PROFIT_EXECUTED) {
    return i18n.t(i18n.l.perps.trade_details_sheet.outcome.earned);
  }
}

const OutcomeInfo = ({ trade }: { trade: HlTrade }) => {
  const { isDarkMode } = useColorMode();
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelSecondary = useForegroundColor('labelSecondary');
  const displayType = getDisplayType(trade);
  const titleText = getTitleText(trade);
  const market = useHyperliquidMarketsStore(state => state.getMarket(trade.symbol));
  // The leverage actually used is currently not available in the trade object
  const assumedLeverage = market?.maxLeverage ?? 1;

  const numberText = useMemo(() => {
    if (displayType !== 'loss' && displayType !== 'profit') {
      return formatCurrency(mulWorklet(trade.size, trade.price));
    }

    const entryPrice = trade.entryPrice ?? trade.price;
    const exitPrice = trade.price;

    if (!entryPrice || !exitPrice) {
      return '0.00%';
    }

    const priceDifferential = subWorklet(exitPrice, entryPrice);
    const baseChange = divWorklet(priceDifferential, entryPrice, '0');
    const directionalChange = trade.isLong ? baseChange : mulWorklet(baseChange, '-1');
    const leveragedChange = mulWorklet(directionalChange, assumedLeverage);
    const percentValue = mulWorklet(leveragedChange, '100');
    const formattedPercent = toFixedWorklet(percentValue, 2);
    const numericPercent = Number(formattedPercent);
    if (!Number.isFinite(numericPercent)) {
      return '0.00%';
    }
    const normalizedPercent = numericPercent === 0 ? '0.00' : formattedPercent;

    return `${normalizedPercent}%`;
  }, [assumedLeverage, displayType, trade.entryPrice, trade.isLong, trade.price, trade.size]);

  const textColor = useMemo(() => {
    switch (displayType) {
      case 'loss':
        return '#FF655A';
      case 'profit':
        return '#23D246';
      case 'info':
        return '#40D0AE';
    }
  }, [displayType]);

  return (
    <Box width="full" alignItems="center" gap={20}>
      <Box gap={14}>
        <Text align="center" size="22pt" weight="heavy" color={{ custom: textColor }}>
          {titleText}
        </Text>
        <Text align="center" size="44pt" weight="heavy" color={{ custom: textColor }}>
          {numberText}
        </Text>
      </Box>
      <Box flexDirection="row" gap={8}>
        <SkiaBadge
          text={`${assumedLeverage}x`}
          height={27}
          horizontalPadding={8}
          fillColor={['rgba(255, 255, 255, 0.16)', 'rgba(0, 0, 0, 0.1)']}
          textColor={isDarkMode ? 'label' : { custom: opacityWorklet(labelSecondary, 0.8) }}
          strokeColor={
            isDarkMode ? ['rgba(255, 255, 255, 0.08)', 'rgba(0, 0, 0, 0.20)'] : ['rgba(255, 255, 255, 0.07)', 'rgba(0, 0, 0, 0.12)']
          }
          strokeWidth={isDarkMode ? 2 : 5 / 3}
          dropShadows={isDarkMode ? [{ dx: 0, dy: 4, blur: 6, color: 'rgba(0, 0, 0, 0.06)' }] : []}
          innerShadows={[{ dx: 0, dy: 1, blur: 2.5, color: 'rgba(255, 255, 255, 0.28)' }]}
          fontSize="15pt"
          fontWeight="heavy"
        />
        <SkiaBadge
          text={i18n.t(trade.isLong ? i18n.l.perps.position_side.long : i18n.l.perps.position_side.short).toUpperCase()}
          height={27}
          horizontalPadding={8}
          fillColor={trade.isLong ? green : red}
          textColor={{ custom: '#FFFFFF' }}
          strokeColor={'rgba(255, 255, 255, 0.12)'}
          strokeWidth={isDarkMode ? 2 : 2 / 3}
          dropShadows={[
            { dx: 0, dy: 8, blur: 12, color: opacityWorklet(trade.isLong ? '#1F9E39' : '#D53F35', 0.12) },
            { dx: 0, dy: 4, blur: 6, color: 'rgba(0, 0, 0, 0.06)' },
          ]}
          innerShadows={[{ dx: 0, dy: 1, blur: 2.5, color: 'rgba(255, 255, 255, 0.28)' }]}
          fontSize="15pt"
          fontWeight="heavy"
          lineHeight={20}
        />
      </Box>
    </Box>
  );
};
