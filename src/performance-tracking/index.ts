import analytics from '@segment/analytics-react-native';
// @ts-ignore
import { SENTRY_ENVIRONMENT } from 'react-native-dotenv';
import PerformanceMetric from './types/PerformanceMetric';
import { PerformanceMetricData } from './types/PerformanceMetricData';

const shouldLogToConsole = __DEV__ || SENTRY_ENVIRONMENT === 'LocalRelease';
const logTag = '[PERFORMANCE]: ';

function logDurationIfAppropriate(
  metric: PerformanceMetric,
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
  PerformanceMetric,
  PerformanceMetricData
>();

/**
 * Function that allows marking the start of a performance measurement.
 * This is useful when you want to mark start time of something
 * that started before we could use startMeasurement function.
 *
 * CAUTION: Remember to use the same timestamp format for start and finish,
 * otherwise you'll end up with skewed measurements.
 *
 * @param metric What you're measuring
 * @param startTimestamp When it started
 * @param additionalParams Any additional context you want to add to your log
 */
function markStartTime(
  metric: PerformanceMetric,
  startTimestamp: number,
  additionalParams?: object
) {
  const current = currentlyTrackedMetrics.get(metric);
  if (current) {
    current.startTimestamp = startTimestamp;
    current.additionalParams = {
      ...current.additionalParams,
      ...additionalParams,
    };
  } else {
    currentlyTrackedMetrics.set(metric, { additionalParams, startTimestamp });
  }
}

/**
 * Function that allows marking the finish of a performance measurement.
 * This is useful when you want to mark finish time of something
 * that already finished, but you don't want to retrieve the start time immediately.
 *
 * CAUTION: Remember to use the same timestamp format for start and finish,
 * otherwise you'll end up with skewed measurements.
 *
 * @param metric What you're measuring
 * @param finishTimestamp When it finished
 * @param additionalParams Any additional context you want to add to your log
 */
function markFinishTime(
  metric: PerformanceMetric,
  finishTimestamp: number,
  additionalParams?: object
) {
  const current = currentlyTrackedMetrics.get(metric);
  if (current) {
    current.finishTimestamp = finishTimestamp;
    current.additionalParams = {
      ...current.additionalParams,
      ...additionalParams,
    };
  } else {
    currentlyTrackedMetrics.set(metric, { additionalParams, finishTimestamp });
  }
}

/**
 * Function that allows commiting a measurement we already have complete data for.
 *
 * @param metric The metric which you want to commit
 * @returns True if we have the complete metric data, false if we don't
 */
function commitMeasurement(metric: PerformanceMetric): boolean {
  const current = currentlyTrackedMetrics.get(metric);
  if (
    current?.startTimestamp !== undefined &&
    current?.finishTimestamp !== undefined
  ) {
    const durationInMs = current.finishTimestamp - current.startTimestamp;
    analytics.track(metric, {
      durationInMs,
      ...current.additionalParams,
    });
    logDurationIfAppropriate(metric, durationInMs);
    currentlyTrackedMetrics.delete(metric);
    return true;
  }
  return false;
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
  metric: PerformanceMetric,
  durationInMs: number,
  additionalParams?: object
) {
  analytics.track(metric, {
    durationInMs,
    ...additionalParams,
  });
}

/**
 * Function that starts a performance measurement.
 * It uses performance.now() to get a start timestamp.
 * If you need more control over timestamps or need to use another format,
 * please use markStartTime/markFinishTime/commitMeasurement API.
 *
 * @param metric What you're measuring
 * @param additionalParams Any additional context you want to add to your log
 */
function startMeasuring(metric: PerformanceMetric, additionalParams?: object) {
  const startTime = performance.now();

  currentlyTrackedMetrics.set(metric, {
    additionalParams,
    startTimestamp: startTime,
  });
}

/**
 * Function that finishes and commits a performance measurement.
 * It uses performance.now() to get a finish timestamp.
 * If you need more control over timestamps or need to use another format,
 * please use markStartTime/markFinishTime/commitMeasurement API.
 *
 * CAUTION: Finish has to be always called after calling start for the same metric before.
 * @param metric What you're measuring
 * @param additionalParams Any additional context you want to add to your log
 * @returns True if the measurement was collected and commited properly, false otherwise
 */
function finishMeasuring(
  metric: PerformanceMetric,
  additionalParams?: object
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

const PerformanceTracking = {
  commitMeasurement,
  finishMeasuring,
  logDirectly,
  markFinishTime,
  markStartTime,
  startMeasuring,
};

export { default as PerformanceMetric } from './types/PerformanceMetric';
export default PerformanceTracking;
