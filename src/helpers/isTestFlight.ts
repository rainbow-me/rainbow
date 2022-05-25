import { NativeModules } from 'react-native';
const { RNTestFlight } = NativeModules;

const isTestFlight = () => {
  const { isTestFlight: testflightBoolean } = ios
    ? RNTestFlight.getConstants().isTestFlight
    : false;

  return testflightBoolean;
};

export default isTestFlight;
