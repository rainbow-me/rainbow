import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import reduceArrayToObject from './reduceArrayToObject';

export const HapticFeedback = {
  impactHeavy: 'impactHeavy',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  keyboardPress: 'keyboardPress', // Android Only
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  selection: 'selection',
} as const;

export type HapticFeedbackType = (typeof HapticFeedback)[keyof typeof HapticFeedback];

const hapticToTrigger = (haptic: HapticFeedbackType) => ({
  [haptic]: () => ReactNativeHapticFeedback.trigger(haptic),
});

const haptics = reduceArrayToObject(Object.values(HapticFeedback).map(hapticToTrigger));

export default haptics;
