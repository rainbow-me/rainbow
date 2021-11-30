import React from 'react';
import Animated from 'react-native-reanimated';

export const enum CurveType {
  basis = 'basis',
  bump = 'bump',
  linear = 'linear',
  monotone = 'monotone',
  natural = 'natural',
  step = 'step',
}

export interface DataType {
  points: {
    x: number;
    y: number;
  }[];
  curve?: CurveType;
}

export interface ChartPathContext {
  data: DataType;
  progress: Animated.SharedValue<number>;
  dotScale: Animated.SharedValue<number>;
  originalX: Animated.SharedValue<string>;
  originalY: Animated.SharedValue<string>;
  pathOpacity: Animated.SharedValue<number>;
  layoutSize: Animated.SharedValue<number>;
  state: Animated.SharedValue<number>;
  isActive: Animated.SharedValue<boolean>;
  positionX: Animated.SharedValue<number>;
  positionY: Animated.SharedValue<number>;
}

export const ChartContext = React.createContext<ChartPathContext | null>(null);
