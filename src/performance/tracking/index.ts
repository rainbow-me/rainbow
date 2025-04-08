import { SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import { analyticsV2 } from '@/analytics';
import { IS_DEV, IS_TEST } from '@/env';
import { StartTime } from '../start-time';
import { event, EventProperties } from '@/analytics/event';
import { logger } from '@/logger';
import { Timer } from '@/performance/timer';
import { showPerformanceToast } from './PerformanceToast';

const TRACKING_VERSION = 3;

type PerformanceEvent = typeof event.performanceReport | typeof event.performanceInitializeWallet;

export const PerformanceReports = {
  appStartup: 'app_startup',
} as const;
type PerformanceReport = (typeof PerformanceReports)[keyof typeof PerformanceReports];

export const PerformanceReportSegments = {
  appStartup: {
    loadJSBundle: 'load_js_bundle',
    runShim: 'run_shim',
    loadMainModule: 'load_main_module',
    mountNavigation: 'mount_navigation',
    initSentry: 'init_sentry',
    initWalletConnect: 'init_walletconnect',
    initRootComponent: 'init_root_component',
    hideSplashScreen: 'hide_splash_screen',
    tti: 'tti',
    // The time it takes for from the root navigation being ready until the initial screen is interactive
    initialScreenInteractiveRender: 'initial_screen_interactive_render',
  },
} as const;

interface ReportSegment {
  name: string;
  duration: number;
}

interface Report {
  startTime: number;
  segments: ReportSegment[];
  totalDuration?: number;
  params?: Params;
}

type Params = Record<string, unknown>;

class PerformanceTracker {
  analyticsTrackingEnabled = !IS_TEST && !IS_DEV && SENTRY_ENVIRONMENT !== 'LocalRelease';
  // Toggle if you want console logs
  debug = false;
  appStartTime = StartTime.START_TIME;
  timer = new Timer();
  reports = new Map<string, Report>();

  logDirectly(metric: PerformanceEvent, durationInMs: number, params?: Params) {
    this.trackMetric(metric, durationInMs, params);
  }

  logFromAppStartTime(metric: PerformanceEvent, params?: Params) {
    const durationInMs = Date.now() - this.appStartTime;
    this.trackMetric(metric, durationInMs, params);
  }

  startMeasuring(metric: PerformanceEvent, params?: Params) {
    this.timer.start(metric, params);
  }

  finishMeasuring(metric: PerformanceEvent, params?: Params) {
    const result = this.timer.stop(metric);
    if (!result) return;

    const { duration, params: startParams } = result;
    this.trackMetric(metric, duration, {
      ...startParams,
      ...params,
    });
  }

  trackMetric(metric: PerformanceEvent, durationInMs: number, params?: Params) {
    const paramsToTrack = {
      durationInMs,
      performanceTrackingVersion: TRACKING_VERSION,
      ...params,
    } as EventProperties[PerformanceEvent];

    if (this.analyticsTrackingEnabled) {
      analyticsV2.track(metric, paramsToTrack);
    }
    if (this.debug) {
      console.log(`[PERFORMANCE]: ${metric}`, JSON.stringify(paramsToTrack, null, 2));
    }
  }

  clearMeasure(metric: PerformanceEvent) {
    this.timer.stop(metric);
  }

  startReport(reportName: PerformanceReport, startTime?: number) {
    if (this.reports.has(reportName)) {
      logger.debug(`[PERFORMANCE]: Report ${reportName} already started`);
      return;
    }
    // Reports need to be anchored to Date.now() rather than performance.now()
    // to allow comparison across different contexts (native vs. JS)
    this.reports.set(reportName, {
      startTime: startTime ?? Date.now(),
      segments: [],
    });
  }

  getReport(reportName: PerformanceReport) {
    const report = this.reports.get(reportName);
    if (!report) {
      logger.debug(`[PERFORMANCE]: Report ${reportName} not found`);
    }
    return report;
  }

  startReportSegment(reportName: PerformanceReport, segmentName: string) {
    const report = this.getReport(reportName);
    if (!report) return;
    this.timer.start(`${reportName}:${segmentName}`);
  }

  finishReportSegment(reportName: PerformanceReport, segmentName: string) {
    const report = this.getReport(reportName);
    if (!report) return;

    const result = this.timer.stop(`${reportName}:${segmentName}`);
    if (!result) return;
    const { duration } = result;

    report.segments.push({
      name: segmentName,
      duration,
    });
  }

  /**
   * Logs a report segment with duration relative to the report's start time
   */
  logReportSegmentRelative(reportName: PerformanceReport, segmentName: string) {
    const report = this.getReport(reportName);
    if (!report) return;

    report.segments.push({
      name: segmentName,
      duration: Date.now() - report.startTime,
    });
  }

  /**
   * Adds parameters to be included in the final report
   */
  addReportParams(reportName: PerformanceReport, params: Params) {
    const report = this.getReport(reportName);
    if (!report) return;

    report.params = {
      ...report.params,
      ...params,
    };
  }

  finishReport(reportName: PerformanceReport, extraParams?: Params) {
    const report = this.getReport(reportName);
    if (!report) return;

    const totalDuration = Date.now() - report.startTime;
    report.totalDuration = totalDuration;

    const segments = report.segments.reduce(
      (acc, segment) => {
        acc[segment.name] = segment.duration;
        return acc;
      },
      {} as Record<string, number>
    );

    // This is strictly for debugging purposes
    if (reportName === PerformanceReports.appStartup && !IS_TEST) {
      showPerformanceToast(segments);
    }

    this.trackMetric(event.performanceReport, totalDuration, {
      segments,
      reportName,
      data: {
        ...report.params,
        ...extraParams,
      },
    });

    this.reports.delete(reportName);
  }

  clearReport(reportName: PerformanceReport) {
    this.reports.delete(reportName);
  }
}

export const PerformanceTracking = new PerformanceTracker();
