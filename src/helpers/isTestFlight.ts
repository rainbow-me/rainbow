import { NativeModules } from 'react-native';

const { RNTestFlight } = NativeModules;
const isTestFlight = ios ? RNTestFlight.getConstants().isTestFlight : false;

export default isTestFlight;
