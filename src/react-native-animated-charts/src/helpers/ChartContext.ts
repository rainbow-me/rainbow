import React from 'react';
import Animated from 'react-native-reanimated';
import { Path } from 'react-native-redash';

export const CurveType = {
  basis: 'basis',
  bump: 'bump',
  linear: 'linear',
  monotone: 'monotone',
  natural: 'natural',
  step: 'step',
} as const;

export interface Point {
  x: number;
  y: number;
}

export interface DataType {
  yRange: [number, number];
  points: Point[];
  nativePoints?: Point[];
  curve?: keyof typeof CurveType;
}

export type CallbackType = {
  data: DataType;
  width: number;
  height: number;
  yRange?: [number, number];
};

export interface PathData {
  path: string;
  parsed: null | Path;
  points: Point[];
  data: Point[];
  smallestX?: Point;
  smallestY?: Point;
  greatestX?: Point;
  greatestY?: Point;
}

export interface PathScales {
  scaleX: (value: number) => number;
  scaleY: (value: number) => number;
}

export interface ChartData {
  data: DataType;
  width: number;
  height: number;
  progress: Animated.SharedValue<number>;
  dotScale: Animated.SharedValue<number>;
  originalX: Animated.SharedValue<string>;
  originalY: Animated.SharedValue<string>;
  pathOpacity: Animated.SharedValue<number>;
  state: Animated.SharedValue<number>;
  isActive: Animated.SharedValue<boolean>;
  positionX: Animated.SharedValue<number>;
  positionY: Animated.SharedValue<number>;
  previousPath: PathData | null;
  currentPath: PathData | null;
}

export const ChartContext = React.createContext<ChartData | null>(null);
