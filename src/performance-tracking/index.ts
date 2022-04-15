import analytics from '@segment/analytics-react-native';
import PerformanceMetric from './types/PerformanceMetric';
import { PerformanceMetricData } from './types/PerformanceMetricData';

const currentlyTrackedMetrics = new Map<
  PerformanceMetric,
  PerformanceMetricData
>();

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

function startMeasuring(
  metric: PerformanceMetric,
  startTimestamp?: number,
  additionalParams?: object
) {
  const startTime = startTimestamp ?? performance.now();

  currentlyTrackedMetrics.set(metric, {
    additionalParams,
    startTimestamp: startTime,
  });
}

function finishMeasuring(
  metric: PerformanceMetric,
  finishTimestamp?: number,
  additionalParams?: object
) {
  const savedEntry = currentlyTrackedMetrics.get(metric);
  if (savedEntry === undefined || savedEntry.startTimestamp === undefined) {
    return;
  }

  const finishTime = finishTimestamp ?? performance.now();
  const durationInMs = finishTime - savedEntry.startTimestamp;

  analytics.track(metric, {
    durationInMs,
    ...savedEntry.additionalParams,
    ...additionalParams,
  });
  currentlyTrackedMetrics.delete(metric);
}

const PerformanceTracking = {
  finishMeasuring,
  logDirectly,
  startMeasuring,
};

export { default as PerformanceMetric } from './types/PerformanceMetric';
export default PerformanceTracking;
