import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { parse as parseSvg } from 'react-native-redash';
import {
  CallbackType,
  ChartContext,
  CurveType,
  DataType,
  PathData,
  PathScales,
  Point,
} from '../../helpers/ChartContext';
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

function getCurveType(curveType: keyof typeof CurveType) {
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

function getScales({ data, width, height, yRange }: CallbackType): PathScales {
  const x = data.points.map(item => item.x);
  const y = data.points.map(item => item.y);

  const smallestX = Math.min(...x);
  const smallestY = Array.isArray(yRange) ? yRange[0] : Math.min(...y);
  const greatestX = Math.max(...x);
  const greatestY = Array.isArray(yRange) ? yRange[1] : Math.max(...y);

  const scaleX = scaleLinear().domain([smallestX, greatestX]).range([0, width]);

  const scaleY = scaleLinear()
    .domain([smallestY, greatestY])
    .range([height, 0]);

  return {
    scaleX,
    scaleY,
  };
}

function createPath({ data, width, height, yRange }: CallbackType): PathData {
  const { scaleY, scaleX } = getScales({
    data,
    height,
    width,
    yRange,
  });

  if (!data.points.length) {
    return {
      data: [],
      parsed: null,
      path: '',
      points: [],
    };
  }

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

  const path = shape
    .line<Point>()
    .x(item => scaleX(item.x))
    .y(item => scaleY(item.y))
    .curve(getCurveType(data.curve!))(data.points);

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

export const ChartPathProvider = React.memo<ChartPathProviderProps>(
  ({ children, data, width = WIDTH, height = HEIGHT, yRange }) => {
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
    const [initialPath] = useState<PathData | null>(() =>
      data.points.length ? createPath({ data, height, width, yRange }) : null
    );

    const [paths, setPaths] = useState<[PathData | null, PathData | null]>(
      () => [initialPath, initialPath]
    );

    const previousPath = paths[0];
    const currentPath = paths[1];

    useEffect(() => {
      // we run it only after the first render
      // because we do have initial data in the paths
      // we wait until we receive new stuff in deps
      if (initialized.current) {
        setPaths(([_, curr]) => [
          curr,
          data.points.length
            ? createPath({ data, height, width, yRange })
            : null,
        ]);
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

    return (
      <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
    );
  }
);

ChartPathProvider.displayName = 'ChartPathProvider';
