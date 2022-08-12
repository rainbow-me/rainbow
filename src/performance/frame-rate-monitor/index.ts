import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { FrameRateMonitorModule } from './FrameRateMonitorModule';
import { analytics } from '@/analytics';

type FrameRateMonitorType = {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  registerListeners: () => void;
  removeListeners: () => void;
};

const EVENT_NAME = 'Performance Tracked Base Frame Rate Stats';

let isMonitoring = false;
let previousAppState: AppStateStatus | undefined;
let appStateChangeSubscription: NativeEventSubscription | null = null;

function startMonitoring() {
  // TODO: Remove when iOS implementation is done
  if (ios) return;
  if (!isMonitoring) {
    isMonitoring = true;
    FrameRateMonitorModule.startMonitoring();
  }
}

async function stopMonitoring() {
  // TODO: Remove when iOS implementation is done
  if (ios) return;
  if (isMonitoring) {
    isMonitoring = false;
    await FrameRateMonitorModule.stopMonitoring();
    const stats = await FrameRateMonitorModule.getStats();
    // TODO: Remove TEST prefix before releasing to broader audience
    analytics.track(`TEST ${EVENT_NAME}`, { frameRateStats: stats });
  }
}

function onAppStateChange(state: AppStateStatus) {
  if (
    previousAppState === 'background' &&
    state === 'active' &&
    !isMonitoring
  ) {
    startMonitoring();
  } else if (state === 'background' && isMonitoring) {
    stopMonitoring();
  }
  previousAppState = state;
}

function registerListeners() {
  // TODO: Remove when iOS implementation is done
  if (ios) return;
  appStateChangeSubscription = AppState.addEventListener(
    'change',
    onAppStateChange
  );
}

function removeListeners() {
  // TODO: Remove when iOS implementation is done
  if (ios) return;
  if (appStateChangeSubscription) {
    appStateChangeSubscription.remove();
    appStateChangeSubscription = null;
  }
}

export const FrameRateMonitor: FrameRateMonitorType = {
  registerListeners,
  removeListeners,
  startMonitoring,
  stopMonitoring,
};
