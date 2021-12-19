import Animated from 'react-native-reanimated';
Animated.addWhitelistedNativeProps({ text: true });

export { ChartPathProvider } from './charts/linear/ChartPathProvider';
export { default as ChartDot } from './charts/linear/ChartDot';
export { ChartYLabel, ChartXLabel } from './charts/linear/ChartLabels';
export { ChartPath } from './charts/linear/ChartPath';
export { useChartData } from './helpers/useChartData';
export { default as simplifyData } from './simplification/simplifyData';
export { default as monotoneCubicInterpolation } from './interpolations/monotoneCubicInterpolation';
export { default as bSplineInterpolation } from './interpolations/bSplineInterpolation';
export {
  CurrentPositionVerticalLine,
  OpeningPositionHorizontalLine,
} from './charts/linear/ChartLines';
