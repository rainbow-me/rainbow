import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import reduceArrayToObject from './reduceArrayToObject';

const hapticToTrigger = (haptic: HapticFeedbackTypes) => ({
  [haptic]: () => ReactNativeHapticFeedback.trigger(haptic),
});

const haptics = reduceArrayToObject(Object.values(HapticFeedbackTypes).map(hapticToTrigger));

export default haptics;
