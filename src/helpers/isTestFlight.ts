import { NativeModules } from 'react-native';
const { RNTestFlight } = NativeModules;

const isTestFlight = () => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  const { isTestFlight: testflightBoolean } = ios
    ? RNTestFlight.getConstants().isTestFlight
    : false;

  return testflightBoolean;
};

export default isTestFlight;
