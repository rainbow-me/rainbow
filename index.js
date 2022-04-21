/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import {
  PerformanceMetric,
  PerformanceTracking,
} from './src/performance-tracking';

PerformanceTracking.startMeasuring(PerformanceMetric.loadRootAppComponent);
PerformanceTracking.startMeasuring(PerformanceMetric.timeToInteractive);

/*
We need to use require calls in order to stop babel from moving imports
to the top of the file above all other calls. We want Performance tracking
to start before all of the imports.
 */
require('react-native-gesture-handler');
require('./shim');
require('./src/model/config');

require('./src/App');
