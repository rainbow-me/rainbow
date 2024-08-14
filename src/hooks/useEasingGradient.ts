import chroma from 'chroma-js';
import { useMemo } from 'react';
import { Easing, EasingFunction } from 'react-native-reanimated';

type PositionObject = { x: number; y: number };
type Position = 'bottom' | 'left' | 'right' | 'top' | PositionObject;

export interface UseEasingGradientParams {
  easing?: EasingFunction;
  endColor: string;
  endOpacity?: number;
  endPosition?: Position;
  startColor: string;
  startOpacity?: number;
  startPosition?: Position;
  steps?: number;
}

interface GradientOutput {
  colors: string[];
  end: PositionObject;
  locations: number[];
  start: PositionObject;
}

const getPositionCoordinates = (position: Position): PositionObject => {
  if (typeof position === 'object') {
    return position;
  }
  switch (position) {
    case 'bottom':
      return { x: 0.5, y: 1 };
    case 'left':
      return { x: 0, y: 0.5 };
    case 'right':
      return { x: 1, y: 0.5 };
    case 'top':
    default:
      return { x: 0.5, y: 0 };
  }
};

export const useEasingGradient = ({
  easing = Easing.inOut(Easing.sin),
  endColor,
  endOpacity = 1,
  endPosition = 'bottom',
  startColor,
  startOpacity = 0,
  startPosition = 'top',
  steps = 16,
}: UseEasingGradientParams): GradientOutput => {
  return useMemo(() => {
    const colors: string[] = [];
    const locations: number[] = [];

    const startColorWithOpacity = chroma(startColor).alpha(startOpacity);
    const endColorWithOpacity = chroma(endColor).alpha(endOpacity);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easedT = easing(t);

      const interpolatedColor = chroma.mix(startColorWithOpacity, endColorWithOpacity, easedT, 'rgb');

      colors.push(interpolatedColor.css());
      locations.push(t);
    }

    return {
      colors,
      end: getPositionCoordinates(endPosition),
      locations,
      start: getPositionCoordinates(startPosition),
    };
  }, [easing, endColor, endOpacity, endPosition, startColor, startOpacity, startPosition, steps]);
};
