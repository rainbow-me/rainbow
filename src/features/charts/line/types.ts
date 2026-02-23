import { type SkPicture } from '@shopify/react-native-skia';
import { type SharedValue } from 'react-native-reanimated';

// ============ Drawing Parameters ============================================= //

/**
 * Parameters passed to drawing methods for coordinate calculations.
 * Used by both candlestick and line chart renderers.
 */
export type DrawParams = {
  /** Width available for plotting (excludes y-axis gutter) */
  availableWidth: number;
  /** Height of the price region (excluding volume area for candlestick) */
  chartRegionHeight: number;
  /** Latest timestamp in the domain */
  domainEndTs: number;
  /** Earliest timestamp in the domain */
  domainStartTs: number;
  /** Last visible index in data array */
  endIndex: number;
  /** Maximum price in visible range */
  maxPrice: number;
  /** Minimum price in visible range */
  minPrice: number;
  /** X offset for panning/centering */
  offsetX: number;
  /** First visible index in data array */
  startIndex: number;
  /** Distance between data points */
  stride: number;
};

// ============ Chart Configuration ============================================ //

/** Grid configuration for chart rendering. */
export type GridConfig = {
  /** Grid line color */
  color: string;
  /** Whether to use dotted lines */
  dotted: boolean;
  /** Grid line stroke width */
  strokeWidth: number;
};

/** Crosshair configuration for chart rendering. */
export type CrosshairConfig = {
  /** Crosshair dot color */
  dotColor: string;
  /** Crosshair dot size */
  dotSize: number;
  /** Crosshair dot stroke width */
  dotStrokeWidth: number;
  /** Crosshair line color */
  lineColor: string;
  /** Crosshair line stroke width */
  strokeWidth: number;
  /** Vertical offset for crosshair position */
  yOffset: number;
};

/** Base configuration shared across chart types. */
export type BaseChartConfig = {
  chart: {
    /** Background color */
    backgroundColor: string;
    /** Vertical padding ratio for price range */
    paddingRatioVertical: number;
    /** Gap between chart and X-axis labels */
    xAxisGap: number;
    /** Height of X-axis label area */
    xAxisHeight: number;
    /** Horizontal inset for X-axis labels */
    xAxisInset: number;
    /** Left padding for Y-axis labels */
    yAxisPaddingLeft: number;
    /** Right padding for Y-axis labels */
    yAxisPaddingRight: number;
  };
  crosshair: CrosshairConfig;
  grid: GridConfig;
};

// ============ Shared Values ================================================== //

/** Shared values used by chart managers for reactive state. */
export type ChartSharedValues = {
  /** Main chart picture */
  chartPicture: SharedValue<SkPicture>;
  /** Maximum Y value (price) in visible range */
  chartMaxY: SharedValue<number>;
  /** Minimum Y value (price) in visible range */
  chartMinY: SharedValue<number>;
  /** Current zoom scale */
  chartScale: SharedValue<number>;
  /** Crosshair overlay picture */
  crosshairPicture: SharedValue<SkPicture>;
  /** Whether a gesture is currently active */
  isChartGestureActive: SharedValue<boolean>;
  /** Whether pan deceleration is active */
  isDecelerating: SharedValue<boolean>;
  /** Current X offset (pan position) */
  offset: SharedValue<number>;
};

// ============ Bounds and Range =============================================== //

/** Represents the visible range of data indices. */
export type VisibleRange = {
  endIndex: number;
  startIndex: number;
};

/** Price bounds with visible range. */
export type PriceBounds = {
  endIndex: number;
  max: number;
  min: number;
  startIndex: number;
};
