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
  ScalesFunctions,
} from '../../helpers/ChartContext';

export const { width: WIDTH } = Dimensions.get('window');
const HEIGHT = 146.5;

interface ChartPathProviderProps {
  data: DataType;
  width?: number;
  height?: number;
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

export const ChartPathProvider: React.FC<ChartPathProviderProps> = ({
  children,
  data,
  width = WIDTH,
  height = HEIGHT,
}) => {
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
    ({ data, width, height }: CallbackType): ScalesFunctions => {
      const x = data.points.map(item => item.x);
      const y = data.points.map(item => item.y);

      const scaleX = scaleLinear()
        .domain([Math.min(...x), Math.max(...x)])
        .range([0, width]);

      const scaleY = scaleLinear()
        .domain([Math.min(...y), Math.max(...y)])
        .range([height, 0]);

      return {
        scaleY,
        scaleX,
      };
    },
    []
  );

  const createPath = useCallback(
    ({ data, width, height }: CallbackType): PathData => {
      const { scaleX, scaleY } = getScales({ data, width, height });

      if (!data.points.length) {
        return {
          path: '',
          parsed: null,
          points: [],
          data: [],
        };
      }

      const points: DataType['points'] = [];

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

      return { path, parsed, points, data: data.points };
    },
    []
  );

  const initialized = useRef(false);

  const initialPath = useMemo(() => createPath({ data, width, height }), []);

  const [paths, setPaths] = useState<[PathData, PathData]>(() => [
    initialPath,
    initialPath,
  ]);

  const currentPath = paths[1];

  useEffect(() => {
    console.log('Set path');
    if (initialized.current) {
      setPaths(([_, curr]) => [curr, createPath({ data, width, height })]);
    } else {
      initialized.current = true;
    }
  }, [data.points, data.curve, width, height]);

  const value = useMemo(
    () => ({
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
      paths,
      width,
      height,
      currentPath,
    }),
    [data]
  );

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
};
