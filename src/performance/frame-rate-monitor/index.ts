import {
  AppState,
  AppStateStatus,
  NativeEventSubscription,
} from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { FrameRateMonitorModule } from './FrameRateMonitorModule';

type FrameRateMonitorType = {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  registerListeners: () => void;
  removeListeners: () => void;
  flushStats: () => void;
};

const kv = new MMKV({ id: 'frameratemonitor' });
let isMonitoring = false;
let previousAppState: AppStateStatus | undefined;
let appStateChangeSubscription: NativeEventSubscription | null = null;

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

function registerListeners() {
  appStateChangeSubscription = AppState.addEventListener(
    'change',
    onAppStateChange
  );
}

function removeListeners() {
  if (appStateChangeSubscription) {
    appStateChangeSubscription.remove();
    appStateChangeSubscription = null;
  }
}

function flushStats() {
  const keys = kv.getAllKeys();
  global.console.log('MMKV KEYS FOR FRAMERATE: ', keys);
}

export const FrameRateMonitor: FrameRateMonitorType = {
  flushStats,
  registerListeners,
  removeListeners,
  startMonitoring,
  stopMonitoring,
};
