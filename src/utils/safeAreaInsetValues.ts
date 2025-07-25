import { initialWindowMetrics } from 'react-native-safe-area-context';

export default {
  bottom: initialWindowMetrics?.insets?.bottom ?? 0,
  left: initialWindowMetrics?.insets.left ?? 0,
  right: initialWindowMetrics?.insets.right ?? 0,
  top: initialWindowMetrics?.insets.top ?? 0,
};
