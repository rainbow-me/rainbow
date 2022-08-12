import { NativeModules } from 'react-native';

type FrameRateMonitorModuleInterface = {
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  getStats: () => Promise<{
    sessionDuration: number;
    screenFrameRate: number;
    totalFramesDrawn: number;
    totalFramesDropped: number;
  }>;
};

const dummyModule: FrameRateMonitorModuleInterface = {
  getStats: () =>
    new Promise(resolve =>
      resolve({
        screenFrameRate: 0,
        sessionDuration: 0,
        totalFramesDrawn: 0,
        totalFramesDropped: 0,
      })
    ),
  startMonitoring: () => new Promise(resolve => resolve()),
  stopMonitoring: () => new Promise(resolve => resolve()),
};
export const FrameRateMonitorModule: FrameRateMonitorModuleInterface = android
  ? NativeModules.RNFrameRateMonitorModule
  : dummyModule;
