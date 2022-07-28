import { NativeModules } from 'react-native';

type FrameRateMonitorModuleInterface = {
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  getStats: () => Promise<object>;
  addSlowPeriodEventListener: any;
  removeSlowPeriodEventListener: any;
  resetStats: any;
};

export const FrameRateMonitorModule: FrameRateMonitorModuleInterface =
  NativeModules.RNFrameRateMonitorModule;
