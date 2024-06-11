/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import '@walletconnect/react-native-compat';
import { initSentry } from '@/logger/sentry';
import { analytics } from './src/analytics';
import { StartTime } from './src/performance/start-time';
import { PerformanceTracking } from './src/performance/tracking';
import { PerformanceMetrics } from './src/performance/tracking/types/PerformanceMetrics';

initSentry();

analytics.track('Started executing JavaScript bundle');
PerformanceTracking.logDirectly(PerformanceMetrics.loadJSBundle, Date.now() - StartTime.START_TIME);
PerformanceTracking.startMeasuring(PerformanceMetrics.loadRootAppComponent);
PerformanceTracking.startMeasuring(PerformanceMetrics.timeToInteractive);

/*
We need to use require calls in order to stop babel from moving imports
to the top of the file above all other calls. We want Performance tracking
to start before all of the imports.
 */
require('react-native-gesture-handler');
require('./shim');
require('./src/App');
