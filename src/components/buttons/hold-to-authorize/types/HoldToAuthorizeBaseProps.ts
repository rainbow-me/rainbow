import { StyleProp, ViewStyle } from 'react-native';
import { DeviceDimensions } from '@/hooks';
import { Colors } from '@/styles';

export interface HoldToAuthorizeBaseProps {
  backgroundColor: string;
  colors: Colors;
  deviceDimensions: DeviceDimensions;
  disabled: boolean;
  disabledBackgroundColor: string;
  disableShimmerAnimation?: boolean;
  enableLongPress?: boolean;
  hideInnerBorder: boolean;
  isAuthorizing: boolean;
  label: string;
  ledger?: boolean;
  onLongPress: () => void;
  parentHorizontalPadding: number;
  shadows: [number, number, number, string, number][];
  showBiometryIcon: boolean;
  smallButton: boolean;
  style: StyleProp<ViewStyle>;
  testID: string;
  theme: 'light' | 'dark';
  tinyButton?: boolean;
  loading?: boolean;
}
