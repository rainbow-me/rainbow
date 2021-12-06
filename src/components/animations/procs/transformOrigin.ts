import { multiply } from './math';

export default function transformOrigin(
  x: any,
  y: any,
  ...transformations: any[]
) {
  return [
    { translateX: x },
    { translateY: y },
    ...transformations,
    { translateX: multiply(x, -1) },
    { translateY: multiply(y, -1) },
  ];
}
