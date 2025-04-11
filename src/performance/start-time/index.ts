import { NativeModules } from 'react-native';

const { Performance } = NativeModules;
export const APP_START_TIME = parseFloat(Performance.getConstants().startupTimestamp);
