import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { parse as parseSvg } from 'react-native-redash';
import { CallbackType, ChartContext, CurveType, DataType, PathData, PathScales, Point } from '../../helpers/ChartContext';
import { findYExtremes } from '../../helpers/extremesHelpers';

const { width: WIDTH } = Dimensions.get('window');

const HEIGHT = 146.5;

interface ChartPathProviderProps {
  data: DataType;
  width?: number;
  height?: number;
  yRange?: [number, number];
  children: React.ReactNode;
}

function getCurveType(curveType: keyof typeof CurveType | undefined) {
  switch (curveType) {
    case CurveType.basis:
      return shape.curveBasis;
    case CurveType.bump:
      return shape.curveBumpX;
    case CurveType.linear:
      return shape.curveLinear;
    case CurveType.monotone:
      return shape.curveMonotoneX;
    case CurveType.natural:
      return shape.curveNatural;
    case CurveType.step:
      return shape.curveStep;
    default:
      return shape.curveBasis;
  }
}

function detectFlatData(yValues: number[]): boolean {
  if (!yValues.length) return false;

  const firstY = yValues[0];
  return yValues.every(y => Math.abs(y - firstY) < 0.000000001);
}

function detectStablecoin(yValues: number[]): boolean {
  if (!yValues.length) return false;

  const threshold = 0.01;
  const closeToOneCount = yValues.filter(y => Math.abs(y - 1.0) < threshold).length;

  // If at least 95% of points are close to 1.0, consider it a stablecoin
  // this handles cases where there are random deviations from the 1.0 line
  return closeToOneCount / yValues.length > 0.95;
}

function detectNearlyFlatData(yValues: number[]): boolean {
  if (!yValues.length) return false;

  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const percentChange = minY > 0 ? ((maxY - minY) / minY) * 100 : 0;
  return percentChange < 0.1;
}

function getScales({ data, width, height, yRange }: CallbackType): PathScales {
  const x = data.points.map(item => item.x);
  const y = data.points.map(item => item.y);

  const smallestX = Math.min(...x);
  const greatestX = Math.max(...x);

  const isFlat = detectFlatData(y);
  const isNearlyFlat = detectNearlyFlatData(y);
  const isStablecoin = detectStablecoin(y);

  let smallestY, greatestY;

  if (Array.isArray(yRange)) {
    // Use provided yRange if available
    smallestY = yRange[0];
    greatestY = yRange[1];
  } else if (isFlat || isNearlyFlat) {
    // For flat or nearly flat data, add padding to prevent spikes
    const avgY = y.reduce((sum, val) => sum + val, 0) / y.length;
    // Add 0.5% padding above and below for flat data
    const padding = avgY * 0.005;
    smallestY = avgY - padding;
    greatestY = avgY + padding;
  } else if (isStablecoin) {
    smallestY = Math.round(Math.min(...y));
    greatestY = Math.round(Math.max(...y));
  } else {
    // For non-flat data, use actual min/max with minimal padding
    smallestY = Math.min(...y);
    greatestY = Math.max(...y);

    // Add a small padding (0.5%) to prevent data from touching edges
    const range = greatestY - smallestY;
    const padding = Math.max(range * 0.005, smallestY * 0.005);
    smallestY = smallestY - padding;
    greatestY = greatestY + padding;
  }

  const scaleX = scaleLinear().domain([smallestX, greatestX]).range([0, width]);
  const scaleY = scaleLinear().domain([smallestY, greatestY]).range([height, 0]);

  return {
    scaleX,
    scaleY,
    isFlat,
    isNearlyFlat,
  };
}

function createPath({ data, width, height, yRange }: CallbackType): PathData {
  if (!data.points.length) {
    return {
      data: [],
      parsed: null,
      path: '',
      points: [],
    };
  }

  const { scaleY, scaleX } = getScales({
    data,
    height,
    width,
    yRange,
  });

  const points: (Point & { originalX: number; originalY: number })[] = [];

  const { greatestY, smallestY } = findYExtremes(data.points) as {
    greatestY: Point;
    smallestY: Point;
  };
  const smallestX = data.points[0];
  const greatestX = data.points[data.points.length - 1];

  for (const point of data.points) {
    points.push({
      originalX: point.x,
      originalY: point.y,
      x: scaleX(point.x),
      y: scaleY(point.y),
    });
  }

  const curveFunction = getCurveType(data.curve);

  const path = shape
    .line<Point>()
    .x(item => scaleX(item.x))
    .y(item => scaleY(item.y))
    .curve(curveFunction)(data.points);

  if (path === null) {
    return {
      data: [],
      parsed: null,
      path: '',
      points: [],
    };
  }

  const parsed = parseSvg(path);

  return {
    data: data.nativePoints || data.points,
    greatestX,
    greatestY,
    parsed,
    path,
    points,
    smallestX,
    smallestY,
  };
}

export const ChartPathProvider = React.memo<ChartPathProviderProps>(({ children, data, width = WIDTH, height = HEIGHT, yRange }) => {
  // path interpolation animation progress
  const progress = useSharedValue(1);

  // animated scale of the dot
  const dotScale = useSharedValue(0);

  // gesture state
  const isActive = useSharedValue(false);

  // current (according to finger position) item of data fields
  const originalX = useSharedValue('');
  const originalY = useSharedValue('');

  const pathOpacity = useSharedValue(1);
  // gesture event state
  const state = useSharedValue(0);

  // position of the dot
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(-1);

  // componentDidMount hack
  const initialized = useRef(false);

  // used for memoization since useMemo with empty deps array
  // still can be re-run according to the docs
  const [initialPath] = useState<PathData | null>(() => (data.points.length > 1 ? createPath({ data, height, width, yRange }) : null));

  const [paths, setPaths] = useState<[PathData | null, PathData | null]>(() => [initialPath, initialPath]);

  const previousPath = paths[0];
  const currentPath = paths[1];

  useEffect(() => {
    // we run it only after the first render
    // because we do have initial data in the paths
    // we wait until we receive new stuff in deps
    if (initialized.current) {
      setPaths(([, curr]) => [curr, data.points.length > 1 ? createPath({ data, height, width, yRange }) : null]);
    } else {
      // componentDidMount hack
      initialized.current = true;
    }

    // i don't want to react to data changes, because it can be object
    // curve and points only mattery for us
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.points, data.curve, width, height, yRange]);

  const value = useMemo(() => {
    const ctx = {
      currentPath,
      data,
      dotScale,
      height,
      isActive,
      originalX,
      originalY,
      pathOpacity,
      positionX,
      positionY,
      previousPath,
      progress,
      state,
      width,
    };

    if (currentPath) {
      const { smallestX, smallestY, greatestX, greatestY } = currentPath;

      return {
        ...ctx,
        greatestX,
        greatestY,
        smallestX,
        smallestY,
      };
    }

    return ctx;
  }, [
    data,
    currentPath,
    previousPath,
    width,
    height,
    dotScale,
    isActive,
    state,
    originalX,
    originalY,
    pathOpacity,
    positionX,
    positionY,
    progress,
  ]);

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
});

ChartPathProvider.displayName = 'ChartPathProvider';
