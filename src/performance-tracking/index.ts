import analytics from '@segment/analytics-react-native';
// @ts-ignore
import { SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import { PerformanceMetricData } from './types/PerformanceMetricData';
import { PerformanceMetricsType } from './types/PerformanceMetrics';
import { PerformanceTagsType } from './types/PerformanceTags';

const shouldLogToConsole = __DEV__ || SENTRY_ENVIRONMENT === 'LocalRelease';
const logTag = '[PERFORMANCE]: ';

function logDurationIfAppropriate(
  metric: PerformanceMetricsType,
  durationInMs: number,
  ...additionalArgs: any[]
) {
  if (shouldLogToConsole) {
    global.console.log(
      logTag,
      `${metric}, duration: ${durationInMs.toFixed(2)}ms`,
      ...additionalArgs
    );
  }
}

const currentlyTrackedMetrics = new Map<
  PerformanceMetricsType,
  PerformanceMetricData
>();

interface AdditionalParams extends Record<string, any> {
  tag?: PerformanceTagsType;
}

/**
 * Function that allows directly commiting performance events.
 * Useful when we already have duration of something and just want to log it.
 *
 * @param metric What you're measuring
 * @param durationInMs How long did it take
 * @param additionalParams Any additional context you want to add to your log
 */
function logDirectly(
  metric: PerformanceMetricsType,
  durationInMs: number,
  additionalParams?: AdditionalParams
) {
  logDurationIfAppropriate(metric, durationInMs);
  analytics.track(metric, {
    durationInMs,
    ...additionalParams,
  });
}

/**
 * Function that starts a performance measurement.
 * It uses performance.now() to get a start timestamp.
 *
 * @param metric What you're measuring
 * @param additionalParams Any additional context you want to add to your log
 */
function startMeasuring(
  metric: PerformanceMetricsType,
  additionalParams?: AdditionalParams
) {
  const startTime = performance.now();

  currentlyTrackedMetrics.set(metric, {
    additionalParams,
    startTimestamp: startTime,
  });
}

/**
 * Function that finishes and commits a performance measurement.
 * It uses performance.now() to get a finish timestamp.
 *
 * CAUTION: For the same metric, finishMeasuring must always be called after calling startMeasuring first.
 * The reverse order will result in the measurement not being saved and finishMeasuring returning false.
 *
 * @param metric What you're measuring
 * @param additionalParams Any additional context you want to add to your log
 * @returns True if the measurement was collected and commited properly, false otherwise
 */
function finishMeasuring(
  metric: PerformanceMetricsType,
  additionalParams?: AdditionalParams
): boolean {
  const savedEntry = currentlyTrackedMetrics.get(metric);
  if (savedEntry === undefined || savedEntry.startTimestamp === undefined) {
    return false;
  }

  const finishTime = performance.now();
  const durationInMs = finishTime - savedEntry.startTimestamp;

  analytics.track(metric, {
    durationInMs,
    ...savedEntry.additionalParams,
    ...additionalParams,
  });
  logDurationIfAppropriate(metric, durationInMs);
  currentlyTrackedMetrics.delete(metric);
  return true;
}

/**
 * Function decorator, that tracks performance of a function using performance.now() calls
 * and logs the result with segment.
 * @param fn Function which performance will be measured
 * @param metric What you're measuring, the name of the metric
 * @param additionalParams Any additional context you want to add to your log
 */
export function withPerformanceTracking<Fn extends (...args: any[]) => any>(
  fn: Fn,
  metric: PerformanceMetricsType,
  additionalParams?: AdditionalParams
): (...args: Parameters<Fn>) => ReturnType<Fn> {
  return function wrapper(this: any, ...args: Parameters<Fn>): ReturnType<Fn> {
    const startTime = performance.now();

    // eslint-disable-next-line babel/no-invalid-this
    const res = fn.apply(this, args);

    const durationInMs = performance.now() - startTime;
    logDurationIfAppropriate(metric, durationInMs);
    analytics.track(metric, { durationInMs, ...additionalParams });

    return res;
  };
}

export const PerformanceTracking = {
  finishMeasuring,
  logDirectly,
  startMeasuring,
  withPerformanceTracking,
};
