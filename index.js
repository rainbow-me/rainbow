/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import '@walletconnect/react-native-compat';
import { initSentry } from '@/logger/sentry';
import { PerformanceTracking, PerformanceReports, PerformanceReportSegments } from '@/performance/tracking';
import { StartTime } from '@/performance/start-time';
PerformanceTracking.startReport(PerformanceReports.appStartup, StartTime.START_TIME);
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
