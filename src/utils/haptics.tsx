import { keys, map } from 'lodash';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import reduceArrayToObject from './reduceArrayToObject';

export const HapticFeedbackTypes = {
  impactHeavy: 'impactHeavy',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  selection: 'selection',
};

const hapticToTrigger = haptic => ({
  [haptic]: () => ReactNativeHapticFeedback.trigger(haptic),
});

const haptics = reduceArrayToObject(
  map(keys(HapticFeedbackTypes), hapticToTrigger)
);

export default haptics;
