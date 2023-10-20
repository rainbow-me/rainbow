import React from 'react';
import { SharedValue } from 'react-native-reanimated';
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
  yRange?: [number, number];
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
  points: (Point & { originalY: number; originalX: number })[];
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
  progress: SharedValue<number>;
  dotScale: SharedValue<number>;
  originalX: SharedValue<string>;
  originalY: SharedValue<string>;
  pathOpacity: SharedValue<number>;
  state: SharedValue<number>;
  isActive: SharedValue<boolean>;
  positionX: SharedValue<number>;
  positionY: SharedValue<number>;
  previousPath: PathData | null;
  currentPath: PathData | null;
}

export const ChartContext = React.createContext<ChartData | null>(null);
