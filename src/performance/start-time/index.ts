import { NativeModules } from 'react-native';

interface StartTimeInterface {
  /**
   * Timestamp stating when the application started
   * For iOS it's the process start time
   * For Android it's the time when the MainApplication class started executing
   */
  START_TIME: number;
}

export const StartTime: StartTimeInterface = NativeModules.RNStartTime;
