import { opacity } from '@/framework/ui/utils/opacity';
import { PANEL_BACKGROUND_DARK, PANEL_BACKGROUND_LIGHT } from '@/components/PanelSheet/PanelSheet';
import { Box, useColorMode } from '@/design-system';
import { FloatingSparks } from '@/features/perps/screens/perps-trade-details-sheet/FloatingSparks';
import { PerspectiveGrid } from '@/features/perps/screens/perps-trade-details-sheet/PerspectiveGrid';
import { type HlTrade, TradeExecutionType } from '@/features/perps/types';
import useDimensions from '@/hooks/useDimensions';
import { Blur, Canvas, Group, LinearGradient, Oval, Rect, vec } from '@shopify/react-native-skia';
import { memo } from 'react';

const CONFIG = {
  layout: {
    horizontalInset: 16,
    topSectionHeight: 175,
    gridHeight: 70,
    gridOverflow: 164,
    outcomeInfoOffset: 32,
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
  backgroundBlurredOval: {
    width: 250,
    height: 150,
    opacity: 0.1,
    blur: 24,
  },
  topSectionGradients: {
    loss: {
      bottomToTop: [opacity('#FF584D', 0), '#FF655A'],
      topToBottom: ['#FF584D', opacity('#FF584D', 0)],
    },
    profit: {
      bottomToTop: [opacity('#2EDC51', 0), '#31E054'],
      topToBottom: ['#23D246', opacity('#26D449', 0)],
    },
    info: {
      bottomToTop: [opacity('#62DFBC', 0), '#62DFBC'],
      topToBottom: ['#62DFBC', opacity('#62DFBC', 0)],
    },
  },
};

export const TradeDetailsGraphic = memo(function TradeDetailsGraphic({ trade }: { trade: HlTrade }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const displayType = getDisplayType(trade);
  const isLoss = displayType === 'loss';
  const isOpen = displayType === 'info';
  const backgroundColor = isDarkMode ? PANEL_BACKGROUND_DARK : PANEL_BACKGROUND_LIGHT;
  const sheetWidth = width - CONFIG.layout.horizontalInset;
  const graphicHeight = CONFIG.layout.topSectionHeight + CONFIG.layout.gridHeight;
  const gridOverflow = CONFIG.layout.gridOverflow;
  const gridHeight = CONFIG.layout.gridHeight;
  const gridWidth = sheetWidth + gridOverflow;
  const accentColor = getAccentColor(trade);
  const gridBackgroundGradient = getGridBackgroundGradient(trade);
  const backgroundBlurredOvalColor = opacity(accentColor, CONFIG.backgroundBlurredOval.opacity);
  const backgroundBlurredOvalWidth = CONFIG.backgroundBlurredOval.width;
  const backgroundBlurredOvalHeight = CONFIG.backgroundBlurredOval.height;

  return (
    <Box width={sheetWidth} height={graphicHeight}>
      <Canvas style={{ width: sheetWidth, height: graphicHeight }}>
        {isDarkMode && (
          <Group dither antiAlias>
            <Rect x={0} y={0} width={sheetWidth} height={CONFIG.layout.topSectionHeight} opacity={0.2}>
              <LinearGradient
                colors={CONFIG.topSectionGradients[displayType].bottomToTop}
                start={vec(0, 32)}
                end={vec(0, CONFIG.layout.topSectionHeight)}
              />
            </Rect>
            <Rect x={0} y={0} width={sheetWidth} height={CONFIG.layout.topSectionHeight} opacity={0.03}>
              <LinearGradient
                colors={CONFIG.topSectionGradients[displayType].topToBottom}
                start={vec(0, 0)}
                end={vec(0, CONFIG.layout.topSectionHeight - 32)}
              />
            </Rect>
          </Group>
        )}
        {!isOpen && (
          <FloatingSparks
            height={CONFIG.layout.topSectionHeight}
            width={sheetWidth}
            sparkColor={accentColor}
            direction={isLoss ? 'down' : 'up'}
          />
        )}
        {/* Solid background to hide sparks behind the grid */}
        <Rect x={0} y={CONFIG.layout.topSectionHeight} width={sheetWidth} height={gridHeight} color={backgroundColor} />
        <Group transform={[{ translateY: CONFIG.layout.topSectionHeight }, { translateX: -gridOverflow / 2 }]}>
          <Group opacity={isDarkMode ? CONFIG.grid.opacity.dark : CONFIG.grid.opacity.light}>
            <PerspectiveGrid
              lineColor={isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#E0E0E0'}
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
              colors={[opacity(backgroundColor, 0), backgroundColor]}
              start={vec(0, gridHeight / 2)}
              end={vec(0, gridHeight)}
            />
          </Rect>
          {/* Grid background accent gradient */}
          {isDarkMode && (
            <Rect dither antiAlias x={0} y={0} width={gridWidth} height={gridHeight} opacity={CONFIG.grid.accentOpacity}>
              <LinearGradient colors={gridBackgroundGradient} start={vec(0, 0)} end={vec(0, gridHeight)} />
            </Rect>
          )}
        </Group>
        {/* Background accent blur */}
        <Group dither antiAlias>
          <Oval
            x={sheetWidth / 2 - backgroundBlurredOvalWidth / 2}
            y={CONFIG.layout.outcomeInfoOffset - 24}
            width={backgroundBlurredOvalWidth}
            height={backgroundBlurredOvalHeight}
            color={backgroundBlurredOvalColor}
          />
          <Blur blur={CONFIG.backgroundBlurredOval.blur} />
        </Group>
      </Canvas>
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

function getGridBackgroundGradient(trade: HlTrade) {
  const displayType = getDisplayType(trade);
  switch (displayType) {
    case 'loss':
      return ['#FF584D', opacity('#FF584D', 0)];
    case 'profit':
      return ['#23D246', opacity('#23D246', 0)];
    case 'info':
      return ['#62DFBC', opacity('#62DFBC', 0)];
  }
}
