import Animated from 'react-native-reanimated';
Animated.addWhitelistedNativeProps({ text: true });

// @ts-expect-error ts-migrate(6142) FIXME: Module './charts/linear/ChartPathProvider' was res... Remove this comment to see the full error message
export { default as ChartPathProvider } from './charts/linear/ChartPathProvider';
// @ts-expect-error ts-migrate(6142) FIXME: Module './charts/linear/ChartDot' was resolved to ... Remove this comment to see the full error message
export { default as ChartDot } from './charts/linear/ChartDot';
// @ts-expect-error ts-migrate(6142) FIXME: Module './charts/linear/ChartLabels' was resolved ... Remove this comment to see the full error message
export { ChartYLabel, ChartXLabel } from './charts/linear/ChartLabels';
// @ts-expect-error ts-migrate(6142) FIXME: Module './charts/linear/ChartPath' was resolved to... Remove this comment to see the full error message
export { default as ChartPath } from './charts/linear/ChartPath';
export { default as useChartData } from './helpers/useChartData';
export { default as simplifyData } from './simplification/simplifyData';
export { default as monotoneCubicInterpolation } from './interpolations/monotoneCubicInterpolation';
export { default as bSplineInterpolation } from './interpolations/bSplineInterpolation';
