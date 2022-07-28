import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { FrameRateMonitorModule } from './FrameRateMonitorModule';

type FrameRateMonitorType = {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  registerAppStateChangeListener: () => void;
  removeAppStateChangeListener: () => void;
};

let isMonitoring = false;
let previousAppState: AppStateStatus | undefined;
let appStateChangeSubscription: NativeEventSubscription | undefined;

function startMonitoring() {
  if (!isMonitoring) {
    isMonitoring = true;
    FrameRateMonitorModule.startMonitoring();
  }
}

async function stopMonitoring() {
  if (isMonitoring) {
    isMonitoring = false;
    await FrameRateMonitorModule.stopMonitoring();
    const stats = await FrameRateMonitorModule.getStats();
    global.console.log(JSON.stringify(stats, null, 2));
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

function registerAppStateChangeListener() {
  appStateChangeSubscription = AppState.addEventListener(
    'change',
    onAppStateChange
  );
}

function removeAppStateChangeListener() {
  if (appStateChangeSubscription) {
    appStateChangeSubscription.remove();
  }
}

export const FrameRateMonitor: FrameRateMonitorType = {
  registerAppStateChangeListener,
  removeAppStateChangeListener,
  startMonitoring,
  stopMonitoring,
};
