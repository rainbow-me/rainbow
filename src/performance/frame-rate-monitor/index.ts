import { NativeModules } from 'react-native';

interface FrameRateMonitorInterface {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getStats: () => object;
  addSlowPeriodEventListener: any;
  removeSlowPeriodEventListener: any;
  resetStats: any;
}

export const FrameRateMonitor: FrameRateMonitorInterface =
  NativeModules.RNFrameRateMonitorModule;
