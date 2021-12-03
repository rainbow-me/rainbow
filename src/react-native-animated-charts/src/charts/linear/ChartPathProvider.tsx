import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import * as redash from 'react-native-redash';
import {
  CallbackType,
  ChartContext,
  CurveType,
  DataType,
  PathData,
  Point,
  PathScales,
} from '../../helpers/ChartContext';
import { findYExtremes } from '../../helpers/extremesHelpers';

export const { width: WIDTH } = Dimensions.get('window');
const HEIGHT = 146.5;

interface ChartPathProviderProps {
  data: DataType;
  width?: number;
  height?: number;
  yRange?: [number, number];
}

function getCurveType(curveType: CurveType) {
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

export const ChartPathProvider = React.memo<ChartPathProviderProps>(
  ({ children, data, width = WIDTH, height = HEIGHT, yRange }) => {
    console.log('Provider', !!data);

    const progress = useSharedValue(1);
    const dotScale = useSharedValue(0);
    const isActive = useSharedValue(false);
    const originalX = useSharedValue('');
    const originalY = useSharedValue('');
    const pathOpacity = useSharedValue(1);
    const state = useSharedValue(0);
    const positionX = useSharedValue(0);
    const positionY = useSharedValue(0);

    const getScales = useCallback(
      ({ data, width, height, yRange }: CallbackType): PathScales => {
        const x = data.points.map(item => item.x);
        const y = data.points.map(item => item.y);

        const smallestX = Math.min(...x);
        const smallestY = Math.min(...y);
        const greatestX = Math.max(...x);
        const greatestY = Math.max(...y);

        const scaleX = scaleLinear()
          .domain([smallestX, greatestX])
          .range([0, width]);

        const scaleY = scaleLinear()
          .domain(yRange ?? [smallestY, greatestY])
          .range([height, 0]);

        return {
          scaleY,
          scaleX,
        };
      },
      []
    );

    const createPath = useCallback(
      ({ data, width, height, yRange }: CallbackType): PathData => {
        const { scaleY, scaleX } = getScales({
          data,
          width,
          height,
          yRange,
        });

        if (!data.points.length) {
          return {
            path: '',
            parsed: null,
            points: [],
            data: [],
          };
        }

        const points: Point[] = [];

        const { greatestY, smallestY } = findYExtremes(data.points) as {
          greatestY: Point;
          smallestY: Point;
        };
        const smallestX = data.points[0];
        const greatestX = data.points[data.points.length - 1];

        for (let i = 0; i < data.points.length; i++) {
          points.push({
            x: scaleX(data.points[i].x),
            y: scaleY(data.points[i].y),
          });
        }

        const path = shape
          .line()
          .x((item: Point) => scaleX(item.x))
          .y((item: Point) => scaleY(item.y))
          .curve(getCurveType(data.curve!))(data.points) as string;

        const parsed = redash.parse(path);

        return {
          path,
          parsed,
          points,
          data: data.points,
          smallestX,
          smallestY,
          greatestX,
          greatestY,
        };
      },
      []
    );

    const initialized = useRef(false);

    const initialPath = useMemo(
      () =>
        data.points.length ? createPath({ data, width, height, yRange }) : null,
      []
    );

    const [paths, setPaths] = useState<[PathData | null, PathData | null]>(
      () => [initialPath, initialPath]
    );

    const previousPath = paths[0];
    const currentPath = paths[1];

    useEffect(() => {
      console.log('CurrentPathChange');
    }, [currentPath]);

    useEffect(() => {
      // console.log('Change path', currentPath);
      // if (initialized.current) {
      setPaths(([_, curr]) => [
        curr,
        data.points.length ? createPath({ data, width, height, yRange }) : null,
      ]);

      console.log('Effect', data.points.length);
      // } else {
      //   initialized.current = true;
      // }
    }, [data.points, data.curve, width, height]);

    const value = useMemo(() => {
      const ctx = {
        progress,
        dotScale,
        originalX,
        originalY,
        pathOpacity,
        state,
        positionX,
        positionY,
        isActive,
        data,
        width,
        height,
        previousPath,
        currentPath,
      };

      if (currentPath) {
        const { smallestX, smallestY, greatestX, greatestY } = currentPath;
        Object.assign(ctx, { smallestX, smallestY, greatestX, greatestY });
      }

      return ctx;
    }, [data]);

    return (
      <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
    );
  }
);
