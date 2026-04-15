/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import '@walletconnect/react-native-compat';

import { initSentry } from '@/logger/sentry';
import { APP_START_TIME } from '@/performance/start-time';
import { PerformanceReports, PerformanceReportSegments, PerformanceTracking } from '@/performance/tracking';

// Silence RNFB v23 namespaced-API deprecation warnings to keep Sentry breadcrumbs useful.
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

PerformanceTracking.startReport(PerformanceReports.appStartup, APP_START_TIME);
PerformanceTracking.logReportSegmentRelative(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.loadJSBundle);
PerformanceTracking.startReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.loadMainModule);

initSentry();
/*
We need to use require calls in order to stop babel from moving imports
to the top of the file above all other calls. We want Performance tracking
to start before all of the imports.
 */
require('react-native-gesture-handler');
require('./shim');
require('./src/App');
PerformanceTracking.finishReportSegment(PerformanceReports.appStartup, PerformanceReportSegments.appStartup.loadMainModule);
